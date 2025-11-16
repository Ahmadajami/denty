import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		const dir = locale === 'ar' ? 'rtl' : 'ltr';
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', locale).replace('%dir%', dir)
		});
	});
export const handle: Handle = handleParaglide;
