import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { authschema } from '$lib/auth/schema';
import { localizeHref } from '$lib/paraglide/runtime';

export const load: PageServerLoad = async ({ url }) => {
	// if (locals.user) {
	// 	redirect(302, localizeHref('/dashboard'));
	// }
	const phone = url.searchParams.get('phone');

	return { phone: phone, form: await superValidate(zod4(authschema)) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(authschema));
		if (!form.valid) return fail(400, { form });

		redirect(302, localizeHref('/dashboard'));
	}
};
