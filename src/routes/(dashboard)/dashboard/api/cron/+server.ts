import { json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
	console.log(`[CRON] RUN `);

	// 1. Security: Protect this endpoint
	// Vercel Crons are public HTTP GET requests, so we must check authorization.
	// Ensure you add CRON_SECRET to your Vercel Environment Variables.
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const now = new Date();

	try {
		// 2. Suspend Expired Clinics
		// Finds all clinics that are ACTIVE but have passed their end date
		const expiredClinics = await db.clinic.updateMany({
			where: {
				status: 'ACTIVE',
				subscriptionEndsAt: { lt: now }
			},
			data: {
				status: 'SUSPENDED'
			}
		});

		// 3. Suspend Expired Medical Centers
		const expiredCenters = await db.medicalCenter.updateMany({
			where: {
				status: 'ACTIVE',
				subscriptionEndsAt: { lt: now }
			},
			data: {
				status: 'SUSPENDED'
			}
		});

		console.log(
			`[CRON] Suspended ${expiredClinics.count} clinics and ${expiredCenters.count} centers.`
		);

		return json({
			success: true,
			suspendedClinics: expiredClinics.count,
			suspendedCenters: expiredCenters.count,
			timestamp: now
		});
	} catch (error) {
		console.error('Cron Job Error:', error);
		return json({ success: false, error: 'Database update failed' }, { status: 500 });
	}
}
