import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { localizeHref } from '$lib/paraglide/runtime';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, localizeHref('/login'));
	}

	return { user: locals.user };
};
