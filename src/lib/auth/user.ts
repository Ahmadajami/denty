// app.d.ts

import type { SubscriptionStatus } from '@prisma/client';

/* =================================
   CLINIC OWNER INTERFACE
   - isOwner: true
   - Has ownedClinic
   - Role: USER
   ================================= */
export interface ClinicOwner {
	type: 'CLINIC_OWNER';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;
	userAuthToken: string;
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
	createdAt: Date;
	updatedAt: Date;
}

/* =================================
   MEDICAL CENTER OWNER INTERFACE
   - isOwner: true
   - Has ownedMedicalCenter
   - Role: USER
   ================================= */
export interface MedicalCenterOwner {
	type: 'MEDICAL_CENTER_OWNER';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;
	userAuthToken: string;
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
	createdAt: Date;
	updatedAt: Date;
}

/* =================================
   MEDICAL CENTER DOCTOR INTERFACE
   - isOwner: false
   - Works in a medicalCenter
   - Role: USER
   ================================= */
export interface MedicalCenterDoctor {
	type: 'MEDICAL_CENTER_DOCTOR';
	id: string;
	nameAr: string;
	nameEn: string;
	specialization: string | null;
	phoneNumber: string;
	userAuthToken: string;
	isOwner: false;
	status: SubscriptionStatus;
	role: {
		id: number;
		name: string; // Should be 'USER'
	};
	medicalCenter: {
		id: string;
		centerName: string;
		ownerId: string | null;
		createdAt: Date;
		updatedAt: Date;
	};
	createdAt: Date;
	updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isClinicOwner(user: any): user is ClinicOwner {
	return user?.type === 'CLINIC_OWNER';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMedicalCenterOwner(user: any): user is MedicalCenterOwner {
	return user?.type === 'MEDICAL_CENTER_OWNER';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMedicalCenterDoctor(user: any): user is MedicalCenterDoctor {
	return user?.type === 'MEDICAL_CENTER_DOCTOR';
}
