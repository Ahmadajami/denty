import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { localizeHref } from '$lib/paraglide/runtime';

export const load = (async ({ locals }) => {
	const user = locals.user;

	// Security: If not logged in, send to login
	if (!user) {
		redirect(303, localizeHref('/login'));
	}

	// 1. Check if user has an ACTIVE Clinic membership
	const hasActiveClinic = user.clinicMemberships.some(
		(m) =>
			['OWNER', 'DOCTOR_EMPLOYEE', 'ASSISTANT'].includes(m.role) && m.clinic.status === 'ACTIVE'
	);

	// 2. Check if user has an ACTIVE Medical Center membership
	const hasActiveCenter = user.centerMemberships.some(
		(m) => ['OWNER', 'DOCTOR', 'NURSE'].includes(m.role) && m.medicalCenter.status === 'ACTIVE'
	);

	// 3. If they have ANY working access, kick them out of the "Pending" jail
	if (hasActiveClinic || hasActiveCenter) {
		throw redirect(303, localizeHref('/dashboard'));
	}

	return {
		user
	};
}) satisfies PageServerLoad;
