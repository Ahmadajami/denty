// app.d.ts
import type { SubscriptionStatus } from "$lib/server/db/generated/prisma/enums";

// ==============================
// USER IDENTITY TYPES
// ==============================
export type AppUser = ClinicOwner | MedicalCenterOwner | MedicalCenterDoctor;

/* =================================
   CLINIC OWNER
================================= */
export interface ClinicOwner {
	type: 'CLINIC_OWNER';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;

	isOwner: true;
	status: SubscriptionStatus;
	role: {
		id: number;
		name: string;
	};
	ownedClinic: {
		id: string;
		clinicName: string;
		createdAt: Date;
		updatedAt: Date;
	};
}

/* =================================
   MEDICAL CENTER OWNER
================================= */
export interface MedicalCenterOwner {
	type: 'MEDICAL_CENTER_OWNER';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;

	isOwner: true;
	status: SubscriptionStatus;
	role: {
		id: number;
		name: string;
	};
	ownedMedicalCenter: {
		id: string;
		centerName: string;
		createdAt: Date;
		updatedAt: Date;
	};
}

/* =================================
   MEDICAL CENTER DOCTOR
================================= */
export interface MedicalCenterDoctor {
	type: 'MEDICAL_CENTER_DOCTOR';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;

	isOwner: false;
	status: SubscriptionStatus;
	role: {
		id: number;
		name: string; // always 'USER'
	};
	medicalCenter: {
		id: string;
		centerName: string;
		ownerId: string | null;
		createdAt: Date;
		updatedAt: Date;
	};
}

// ==============================
// TYPE GUARDS
// ==============================
export function isClinicOwner(user: unknown): user is ClinicOwner {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (user as any)?.type === 'CLINIC_OWNER';
}

export function isMedicalCenterOwner(user: unknown): user is MedicalCenterOwner {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (user as any)?.type === 'MEDICAL_CENTER_OWNER';
}

export function isMedicalCenterDoctor(user: unknown): user is MedicalCenterDoctor {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (user as any)?.type === 'MEDICAL_CENTER_DOCTOR';
}

// ==============================
// USER IDENTITY ENUM / DETECTION
// ==============================
export type IdentityType =
	| 'ADMIN'
	| 'CLINIC_OWNER'
	| 'MEDICAL_CENTER_OWNER'
	| 'MEDICAL_CENTER_DOCTOR'
	| 'USER';

/**
 * Determine identity type based on user data from DB
 */
export function whoAmI(user: {
	id: string;
	isOwner: boolean;
	role: { id: number; name: string };
	ownedClinic: { id: string } | null;
	ownedMedicalCenter: { id: string } | null;
	medicalCenter: { id: string } | null;
}): IdentityType {
	// 1️⃣ Admin
	if (user.role.name === 'ADMIN') return 'ADMIN';

	// 2️⃣ Clinic Owner
	if (user.isOwner && user.ownedClinic) return 'CLINIC_OWNER';

	// 3️⃣ Medical Center Owner
	if (user.isOwner && user.ownedMedicalCenter) return 'MEDICAL_CENTER_OWNER';

	// 4️⃣ Medical Center Doctor
	if (!user.isOwner && user.medicalCenter) return 'MEDICAL_CENTER_DOCTOR';

	// 5️⃣ Normal user
	return 'USER';
}
