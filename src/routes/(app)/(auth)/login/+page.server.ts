import { fail } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { message, superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { authschema } from '$lib/auth';
import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime';
import { verifyMe } from '$lib/server/hash-me';

//import { localizeHref } from '$lib/paraglide/runtime';

export const load: PageServerLoad = async ({ url }) => {
	// if (locals.user) {
	// 	redirect(302, localizeHref('/dashboard'));
	// }
	const phone = url.searchParams.get('phone');

	return { phone: phone, form: await superValidate(zod4(authschema)) };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(authschema));
		if (!form.valid) return fail(400, { form });
		const data = form.data;
		const phoneNumber = data.PhoneNumber.replace(/\s/g, '');
		const password = data.password;

		const user = await db.user.findUnique({ where: { phoneNumber } });
		if (!user) {
			return message(form, 'Wrong phone number or password', {
				status: 401
			});
		}
		const userPassword = await verifyMe(password, user.passwordHash);
		if (!userPassword) {
			return message(form, 'Wrong phone number or password', {
				status: 401
			});
		}
		const authenticatedUser = await db.user.update({
			where: { phoneNumber },
			data: { userAuthToken: crypto.randomUUID() }
		});
		cookies.set('session', authenticatedUser.userAuthToken, {
			// send cookie for every page
			path: '/',
			// server side only cookie so you can't use `document.cookie`
			httpOnly: true,
			// only requests from same site can send cookies
			// https://developer.mozilla.org/en-US/docs/Glossary/CSRF
			sameSite: 'strict',
			// only sent over HTTPS in production
			secure: process.env.NODE_ENV === 'production',
			// set cookie to expire after a month
			maxAge: 60 * 60 * 24 * 30
		});
		redirect(302, localizeHref('/dashboard'));
	}
};
