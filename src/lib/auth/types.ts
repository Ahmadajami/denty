
import { z } from 'zod/v4';
import { clinicSchema, medicalSchema } from './schema';
import type { Clinic, Role, MedicalCenter } from '$lib/server/db/generated/prisma/client';

export type ClinicSchema = typeof clinicSchema;
export type MedicalSchema = typeof medicalSchema;

export type ClinicData = z.infer<typeof clinicSchema>;
export type MedicalData = z.infer<typeof medicalSchema>;

export type IdentityType =
	| 'ADMIN'
	| 'CLINIC_OWNER'
	| 'MEDICAL_CENTER_OWNER'
	| 'MEDICAL_CENTER_DOCTOR'
	| 'USER';

export function whoAmI(user: {
	id: string;
	isOwner: boolean;
	role: Role;
	ownedClinic: Clinic | null;
	ownedMedicalCenter: MedicalCenter | null;
	medicalCenter: MedicalCenter | null;
}): IdentityType {
	// 1. Admin overrides everything
	if (user.role.name === 'ADMIN') return 'ADMIN';

	// 2. Clinic Owner
	if (user.isOwner && user.ownedClinic) return 'CLINIC_OWNER';

	// 3. Medical Center Owner
	if (user.isOwner && user.ownedMedicalCenter) return 'MEDICAL_CENTER_OWNER';

	// 4. Medical Center Doctor
	if (!user.isOwner && user.medicalCenter) return 'MEDICAL_CENTER_DOCTOR';

	// 5. Normal user
	return 'USER';
}
