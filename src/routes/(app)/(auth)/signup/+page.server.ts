import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { clinicSchema, medicalSchema } from '$lib/auth';
import { fail, message } from 'sveltekit-superforms';
import { db } from '$lib/server/prisma';
import { hashMe } from '$lib/server/hash-me';
import { localizeHref } from '$lib/paraglide/runtime';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Different schemas, no id required according to the docs
	const clinicForm = await superValidate(zod4(clinicSchema));
	const medicalForm = await superValidate(zod4(medicalSchema));

	// Return both forms
	return { clinicForm, medicalForm };
};

export const actions: Actions = {
	clinicAccount: async ({ request }) => {
		const form = await superValidate(request, zod4(clinicSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const formData = form.data;
		const phoneNumber = formData.phone.replace(/\s/g, ''); // Clean phone number

		try {
			// 1. Validation: Check if User already exists
			const existingUser = await db.user.findUnique({
				where: { phoneNumber }
			});

			if (existingUser) {
				return message(form, 'Phone number already registered', {
					status: 409
				});
			}

			// 2. Validation: Check if Clinic Name is taken
			const existingClinic = await db.clinic.findUnique({
				where: { name: formData.clinicName }
			});

			if (existingClinic) {
				return message(form, 'Clinic name already taken', {
					status: 409
				});
			}

			// 3. Hash Password
			const hashedPassword = await hashMe(formData.password);

			// 4. Nested Write: Create User -> Member -> Clinic in one go
			await db.user.create({
				data: {
					// User Details
					nameEn: formData.name,
					nameAr: formData.name_ar,
					phoneNumber: phoneNumber,
					passwordHash: hashedPassword,
					specialization: formData.specialization,
					userAuthToken: crypto.randomUUID(),
					systemRole: 'CUSTOMER',
					status: 'ACTIVE',

					// Nested write for the relation
					clinicMemberships: {
						create: {
							role: 'OWNER',

							clinic: {
								create: {
									name: formData.clinicName,
									status: 'PENDING'
								}
							}
						}
					}
				}
			});
		} catch (error) {
			console.error('Signup Error:', error);
			return message(form, 'Something went wrong during sign up.', {
				status: 500
			});
		}

		// 5. Redirect to Login
		// Pass the phone number so the login field is pre-filled
		redirect(303, localizeHref(`/login?phone=${phoneNumber}`));
	},
	medicalAccount: async ({ request }) => {
		// 1. Validate Form
		const form = await superValidate(request, zod4(medicalSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const data = form.data;
		const ownerPhone = data.phone.replace(/\s/g, '');

		try {
			/* ---------------------------------------------------------
               2. PRE-FLIGHT VALIDATIONS (Reads only)
               --------------------------------------------------------- */

			// Check Owner Phone
			const existingOwner = await db.user.findUnique({ where: { phoneNumber: ownerPhone } });
			if (existingOwner) {
				return message(form, 'Owner phone already registered', { status: 409 });
			}

			// Check Center Name
			const existingCenter = await db.medicalCenter.findFirst({
				where: { centerName: data.center_name }
			});
			if (existingCenter) {
				return message(form, 'Center name already taken', { status: 409 });
			}

			// Prepare Doctors Data (Clean phones)
			const doctors = data.doctors.map((d) => ({
				...d,
				cleanPhone: d.phone.replace(/\s/g, '')
			}));

			// Check: Owner Phone vs Doctor Phones (Cannot be same)
			if (doctors.some((d) => d.cleanPhone === ownerPhone)) {
				return message(form, 'Owner phone cannot be the same as a doctor phone', { status: 409 });
			}

			// Check: Duplicate Phones within the form (Doctor vs Doctor)
			const uniqueDocPhones = new Set(doctors.map((d) => d.cleanPhone));
			if (uniqueDocPhones.size !== doctors.length) {
				return message(form, 'Duplicate phone numbers found in the doctors list', { status: 400 });
			}

			// Check: Doctor Phones already in Database
			const existingDocs = await db.user.findMany({
				where: { phoneNumber: { in: Array.from(uniqueDocPhones) } },
				select: { phoneNumber: true }
			});

			if (existingDocs.length > 0) {
				return message(form, `Doctor phone ${existingDocs[0].phoneNumber} is already registered`, {
					status: 409
				});
			}

			/* ---------------------------------------------------------
               3. PREPARE PASSWORDS (Hash concurrently)
               --------------------------------------------------------- */
			const ownerHash = await hashMe(data.password);

			const doctorsWithHashes = await Promise.all(
				doctors.map(async (doc) => ({
					...doc,
					passwordHash: await hashMe(doc.password)
				}))
			);

			/* ---------------------------------------------------------
               4. TRANSACTION EXECUTION
               --------------------------------------------------------- */
			await db.$transaction(async (tx) => {
				// A. Create Owner + Medical Center + Owner Membership
				const ownerUser = await tx.user.create({
					data: {
						nameEn: data.name,
						nameAr: data.name_ar,
						phoneNumber: ownerPhone,
						passwordHash: ownerHash,
						specialization: data.specialization,
						userAuthToken: crypto.randomUUID(),
						systemRole: 'CUSTOMER',
						status: 'ACTIVE',

						centerMemberships: {
							create: {
								role: 'OWNER',
								medicalCenter: {
									create: {
										centerName: data.center_name,
										status: 'PENDING'
									}
								}
							}
						}
					},
					include: {
						centerMemberships: true // Needed to extract the new Center ID
					}
				});

				// Get the ID of the newly created center
				const newCenterId = ownerUser.centerMemberships[0].medicalCenterId;

				// B. Create All Doctors linked to this Center
				for (const doc of doctorsWithHashes) {
					await tx.user.create({
						data: {
							nameEn: doc.name,
							nameAr: doc.name_ar,
							phoneNumber: doc.cleanPhone,
							passwordHash: doc.passwordHash,
							specialization: doc.specialization,
							userAuthToken: crypto.randomUUID(),
							systemRole: 'CUSTOMER',
							status: 'ACTIVE',

							// Link to the Center we just created
							centerMemberships: {
								create: {
									role: 'DOCTOR',
									medicalCenterId: newCenterId
								}
							}
						}
					});
				}
			});
		} catch (error) {
			console.error('Medical Signup Error:', error);
			// Catch-all for database errors (like race conditions on unique constraints)
			return message(form, 'Something went wrong during creation.', { status: 500 });
		}

		// 5. Success
		redirect(303, localizeHref(`/login?phone=${ownerPhone}`));
	}
};
