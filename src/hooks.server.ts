import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import type { ClinicOwner, MedicalCenterDoctor, MedicalCenterOwner } from '$lib/auth/user';

import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/prisma';

// Paraglide middleware as a SvelteKit handle
const handleParaglide: Handle = async ({ event, resolve }) => {
	return paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request;

		const dir = locale === 'ar' ? 'rtl' : 'ltr';
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', locale).replace('%dir%', dir)
		});
	});
};
//auth MiddleWare
const handleAuth: Handle = async ({ event, resolve }) => {
	// get cookies from browser
	const session = event.cookies.get('session');

	if (!session) {
		// if there is no session load page as normal
		event.locals.user = null;
		return await resolve(event);
	}
		const user = await db.user.findUnique({
		where: { userAuthToken: session },
		select: {
			id: true,
			nameAr: true,
			nameEn: true,
			phoneNumber: true,
			specialization: true,
			role: true,
			ownedClinic: true,
			ownedMedicalCenter: true,
			isOwner: true,
			medicalCenter: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			userAuthToken: true
		}
	});
	if (!user) {
		event.locals.user = null;
		return await resolve(event);
	}
	// CLINIC OWNER: isOwner = true AND has ownedClinic
	if (user.isOwner && user.ownedClinic) {
		event.locals.user = {
			type: 'CLINIC_OWNER',
			id: user.id,
			nameAr: user.nameAr,
			nameEn: user.nameEn,
			specialization: user.specialization,
			phoneNumber: user.phoneNumber,
			userAuthToken: user.userAuthToken,
			isOwner: true,
			status: user.status,
			role: user.role,
			ownedClinic: user.ownedClinic,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		} as ClinicOwner;
	}
	// MEDICAL CENTER OWNER: isOwner = true AND has ownedMedicalCenter
	else if (user.isOwner && user.ownedMedicalCenter) {
		event.locals.user = {
			type: 'MEDICAL_CENTER_OWNER',
			id: user.id,
			nameAr: user.nameAr,
			nameEn: user.nameEn,
			specialization: user.specialization,
			phoneNumber: user.phoneNumber,
			userAuthToken: user.userAuthToken,
			isOwner: true,
			status: user.status,
			role: user.role,
			ownedMedicalCenter: user.ownedMedicalCenter,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		} as MedicalCenterOwner;
	}
	// MEDICAL CENTER DOCTOR: isOwner = false AND has medicalCenter
	else if (!user.isOwner && user.medicalCenter) {
		event.locals.user = {
			type: 'MEDICAL_CENTER_DOCTOR',
			id: user.id,
			nameAr: user.nameAr,
			nameEn: user.nameEn,
			specialization: user.specialization,
			phoneNumber: user.phoneNumber,
			userAuthToken: user.userAuthToken,
			isOwner: false,
			status: user.status,
			role: user.role,
			medicalCenter: user.medicalCenter,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		} as MedicalCenterDoctor;
	}
	else {
		event.locals.user = null;
	}

	return await resolve(event);
};

// Export the combined sequence
export const handle = sequence(handleParaglide, handleAuth);
