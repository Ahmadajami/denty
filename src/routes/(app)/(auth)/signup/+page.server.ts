import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { clinicSchema, medicalSchema } from '$lib/auth';
import { fail, message } from 'sveltekit-superforms';
import { db } from '$lib/server/prisma';
import { hashMe } from '$lib/server/hash-me';
import { Role } from '$lib/server/role';
import { localizeHref } from '$lib/paraglide/runtime';
import { redirect } from '@sveltejs/kit';
import { SubscriptionStatus } from '@prisma/client';

export const load: PageServerLoad = async () => {
	// Different schemas, no id required according to the docs
	const clinicForm = await superValidate(zod4(clinicSchema));
	const medicalForm = await superValidate(zod4(medicalSchema));

	// Return both forms
	return { clinicForm, medicalForm };
};

export const actions: Actions = {
	clinicAccount: async ({ request }) => {
		console.log('form is fire');
		// validate incoming form data
		const clinicForm = await superValidate(request, zod4(clinicSchema));

		if (!clinicForm.valid) {
			console.log("Clinic Form isn't valid");
			return fail(400, { clinicForm });
		}

		console.log(' Form is Valid Clinic Account :', clinicForm.data);
		const formData = clinicForm.data;
		const phoneNumber = formData.phone.replace(/\s/g, '');
		const user = await db.user.findUnique({
			where: { phoneNumber: phoneNumber }
		});
		if (user) {
			return message(clinicForm, 'Phone number already registered', {
				status: 409
			});
		}

		await db.user.create({
			data: {
				nameAr: formData.name_ar,
				nameEn: formData.name,
				phoneNumber,
				passwordHash: await hashMe(formData.password),
				role: { connect: { name: Role.USER } },
				isOwner: true,
				userAuthToken: crypto.randomUUID(),
				specialization: formData.specialization,
				status: SubscriptionStatus.SUCCESS,
				ownedClinic: {
					create: {
						clinicName: formData.clinicName
					}
				}
			}
		});

		redirect(307, localizeHref(`/login?phone=${phoneNumber}`));
	},
	medicalAccount: async ({ request }) => {
		// Validate incoming form data
		const medicalForm = await superValidate(request, zod4(medicalSchema));
		if (!medicalForm.valid) {
			return fail(400, { medicalForm });
		}

		const data = medicalForm.data;
		const ownerPhone = data.phone.replace(/\s/g, '');

		/* ---------------------------------------------------------
	   1. Check if owner phone is already registered
	--------------------------------------------------------- */
		const existingOwner = await db.user.findUnique({
			where: { phoneNumber: ownerPhone }
		});

		if (existingOwner) {
			return message(medicalForm, 'Phone number already registered', { status: 409 });
		}

		/* ---------------------------------------------------------
	   2. Validate doctors
	--------------------------------------------------------- */

		const doctors = data.doctors.map((d) => ({
			...d,
			phone: d.phone.replace(/\s/g, '')
		}));

		// Check if any doctor has same phone as owner
		const samePhones = doctors.some((doc) => doc.phone === ownerPhone);
		if (samePhones) {
			return message(
				medicalForm,
				'Medical center owner phone number cannot be the same as any doctor phone number',
				{ status: 409 }
			);
		}

		// Check if any doctor phone exists already
		const doctorPhoneChecks = await Promise.all(
			doctors.map((doc) => db.user.findUnique({ where: { phoneNumber: doc.phone } }))
		);

		const duplicateDoctor = doctorPhoneChecks.find((user) => user !== null);
		if (duplicateDoctor) {
			return message(
				medicalForm,
				`Doctor phone number ${duplicateDoctor.phoneNumber} is already registered`,
				{ status: 409 }
			);
		}

		/* ---------------------------------------------------------
	   3. Create Owner + Medical Center
	--------------------------------------------------------- */
		const hashedDoctors = await Promise.all(
			doctors.map(async (doc) => ({
				nameAr: doc.name_ar,
				nameEn: doc.name,
				specialization: doc.specialization,
				phoneNumber: doc.phone,
				passwordHash: await hashMe(doc.password),
				userAuthToken: crypto.randomUUID(),
				role: { connect: { name: Role.USER } }
			}))
		);

		/* ---------------------------------------------------------
	   4. Create Owner + Medical Center + Doctors (nested write)
	--------------------------------------------------------- */

		await db.user.create({
			data: {
				nameAr: data.name_ar,
				nameEn: data.name,
				phoneNumber: ownerPhone,
				specialization: data.specialization,
				passwordHash: await hashMe(data.password),
				userAuthToken: crypto.randomUUID(),
				isOwner: true,
				role: { connect: { name: Role.USER } },

				ownedMedicalCenter: {
					create: {
						centerName: data.center_name,
						doctors: {
							create: hashedDoctors
						}
					}
				}
			}
		});

		redirect(307, localizeHref(`/login?phone=${ownerPhone.replace(/\s/g, '')}`));
	}
};
