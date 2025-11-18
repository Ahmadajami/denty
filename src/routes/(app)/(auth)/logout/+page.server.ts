import { localizeHref } from '$lib/paraglide/runtime.js';
import type { PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// we only use this endpoint for the api
	// and don't need to see the page
	redirect(302, localizeHref('/'));
};

export const actions = {
	default({ cookies }) {
		// eat the cookie
		cookies.set('session', '', {
			path: '/',
			expires: new Date(0)
		});

		// redirect the user
		redirect(302, '/login');
	}
};
