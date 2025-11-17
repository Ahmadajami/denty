import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';


import { sequence } from '@sveltejs/kit/hooks';

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



// Export the combined sequence
export const handle = sequence(handleParaglide);
