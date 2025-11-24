import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllTreatmentsGroups } from '$lib/server/treatment';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Fetch all groups with their treatments
		const groups = await getAllTreatmentsGroups();

		// Return as JSON
		return json(groups, { status: 200 });
	} catch (err) {
		console.error('Error fetching treatment groups:', err);
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};
