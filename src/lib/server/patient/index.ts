import { db } from '$lib/server/prisma';
import type { IdentityType } from '$lib/auth';
import { crudPatientSchema } from '$lib/zod/patient'; // adjust path to your schema
import {
	isClinicOwner,
	isMedicalCenterDoctor,
	isMedicalCenterOwner,
	type AppUser
} from '$lib/auth/user';
import { sanitizePhoneNumber } from '$lib/utils';

interface CreatePatientUser {
	id: string;
	type: IdentityType;
	ownedClinic?: { id: string } | null;
	ownedMedicalCenter?: { id: string } | null;
	medicalCenter?: { id: string } | null;
}

export async function createPatient(user: CreatePatientUser, input: unknown) {
	// ✅ Validate input using your Zod schema
	const parsed = crudPatientSchema.parse(input);

	// Map Zod → Prisma fields
	const { fullname, fullnameAr, phone } = parsed;
	const phoneNumber = sanitizePhoneNumber(phone);
	// Base patient data
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data: any = {
		fullname,
		fullnameAr: fullnameAr,
		phoneNumber: phoneNumber,
		createdById: user.id,
		clinics: { connect: [] },
		medicalCenters: { connect: [] }
	};

	// Auto-link based on user identity
	switch (user.type) {
		case 'CLINIC_OWNER':
			if (user.ownedClinic?.id) {
				data.clinics.connect.push({ id: user.ownedClinic.id });
			}
			break;

		case 'MEDICAL_CENTER_OWNER':
			if (user.ownedMedicalCenter?.id) {
				data.medicalCenters.connect.push({ id: user.ownedMedicalCenter.id });
			}
			break;

		case 'MEDICAL_CENTER_DOCTOR':
			if (user.medicalCenter?.id) {
				data.medicalCenters.connect.push({ id: user.medicalCenter.id });
			}
			break;

		// ADMIN & USER → no automatic linking
		case 'ADMIN':
		case 'USER':
			break;
	}

	// Create patient record
	return await db.patient.create({
		data,
		include: {
			clinics: true,
			medicalCenters: true
		}
	});
}

//search

export async function searchPatients(user: AppUser, query: string) {
	if (!user) return [];
	const phoneNumber = sanitizePhoneNumber(query);
	// 1. Initialize the base filter: Strict Phone Search
	// We use specific 'contains' logic.
	// Note: If you want exact matches only, remove specific object and just use `phoneNumber: query`
	const baseFilter = {
		phoneNumber: { contains: phoneNumber }
	};

	// 2. Define the scope (Security Filter)
	// We will merge this with the baseFilter later
	let scopeFilter = {};

	if (isClinicOwner(user)) {
		// Search only within this owner's clinic
		scopeFilter = {
			clinics: { some: { id: user.ownedClinic?.id } }
		};
	} else if (isMedicalCenterOwner(user)) {
		// Search only within this owner's medical center
		scopeFilter = {
			medicalCenters: { some: { id: user.ownedMedicalCenter?.id } }
		};
	} else if (isMedicalCenterDoctor(user)) {
		// Search only within the doctor's assigned medical center
		scopeFilter = {
			medicalCenters: { some: { id: user.medicalCenter?.id } }
		};
	} else {
		return [];
	}

	// 3. Construct Final Where Clause
	// Merging the Phone check + The Facility check
	const whereClause = {
		...baseFilter,
		...scopeFilter
	};

	// 4. Execute Query
	const p = await db.patient.findMany({
		where: whereClause,
		select: {
			fullname: true,
			fullnameAr: true,
			phoneNumber: true
		},
		orderBy: { createdAt: 'desc' },
		take: 50
	});

	return p;
}
