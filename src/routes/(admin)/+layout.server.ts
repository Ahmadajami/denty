import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const user = locals.user;

	// 1. Basic Auth Check
	if (!user) {
		redirect(303, '/login');
	}

	// 2. Role Check (Gatekeeper)
	// Only SUPER_ADMIN and SUPPORT_AGENT can enter.
	// Regular CUSTOMER (Doctors) are redirected to their own dashboard.
	if (user.systemRole !== 'SUPER_ADMIN') {
		redirect(303, '/dashboard');
	}

	return {
		user
	};
}) satisfies LayoutServerLoad;
