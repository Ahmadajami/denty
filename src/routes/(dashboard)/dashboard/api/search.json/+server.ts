// src/routes/api/patients/+server.ts

import type { RequestHandler } from './$types';

import { searchPatients } from '$lib/server/patient';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const user = locals.user; // from hooks
	if (!user) return json({ message: 'Unauthorized' }, { status: 401 });
	const query = url.searchParams.get('q') ?? '';

	const patients = await searchPatients(user, query);

	return new Response(JSON.stringify(patients), { status: 200 });
};
