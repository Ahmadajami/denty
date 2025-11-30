import { redirect, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/prisma'; // Ensure this matches your db export path
import { localizeHref } from '$lib/paraglide/runtime';

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

// Auth Middleware
const handleAuth: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');

	if (!session) {
		// Ensure locals.user is explicitly null if no session
		// @ts-expect-error - locals type might not explicitly allow null yet depending on app.d.ts
		event.locals.user = null;
		return resolve(event);
	}

	// Fetch User AND their Memberships
	const user = await db.user.findUnique({
		where: { userAuthToken: session },
		select: {
			id: true,
			nameAr: true,
			nameEn: true,
			phoneNumber: true,
			specialization: true,
			systemRole: true,
			status: true,

			// 1. Fetch Clinic Memberships (The "Badges")
			clinicMemberships: {
				select: {
					role: true,
					clinic: {
						select: {
							id: true,
							name: true,
							status: true // We need this for the check below
						}
					}
				}
			},

			// 2. Fetch Center Memberships
			centerMemberships: {
				select: {
					role: true,
					medicalCenter: {
						select: {
							id: true,
							centerName: true,
							status: true // We need this for the check below
						}
					}
				}
			}
		}
	});

	if (user) {
		// @ts-expect-error - Typescript might complain about exact Enum matching, but runtime is valid
		event.locals.user = user;

		// ---------------------------------------------------------
		// SUBSCRIPTION CHECK
		// ---------------------------------------------------------
		// Only run on dashboard routes to prevent blocking public pages/api
		// And avoid infinite loops by excluding the pending page itself
		if (
			event.url.pathname.startsWith('/dashboard') &&
			!event.url.pathname.startsWith('/dashboard/pending')
		) {
			// 1. Check Clinic Status (Blocks Owners AND Employees)
			// We verify if the user has a role that implies 'employment' (not just a visitor)
			const clinicMembership = user.clinicMemberships.find((m) =>
				['OWNER', 'DOCTOR_EMPLOYEE', 'ASSISTANT'].includes(m.role)
			);

			if (clinicMembership && clinicMembership.clinic.status !== 'ACTIVE') {
				redirect(303, localizeHref('/dashboard/pending'));
			}

			// 2. Check Medical Center Status (Blocks Owners, Doctors, Nurses)
			const centerMembership = user.centerMemberships.find((m) =>
				['OWNER', 'DOCTOR', 'NURSE'].includes(m.role)
			);

			if (centerMembership && centerMembership.medicalCenter.status !== 'ACTIVE') {
				redirect(303, localizeHref('/dashboard/pending'));
			}
		}
	} else {
		// @ts-expect-error - Session invalid (user deleted or token changed)
		event.locals.user = null;
	}

	return resolve(event);
};

// Export the combined sequence
export const handle = sequence(handleParaglide, handleAuth);
