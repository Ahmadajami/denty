import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/prisma';
import { z } from 'zod';

// Zod schema to validate the groupId param
const GroupIdSchema = z.object({
	groupId: z.string()
});

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Validate groupId
	const parseResult = GroupIdSchema.safeParse({ groupId: params.id });
	if (!parseResult.success) {
		console.log(parseResult.error);
		return json({ message: 'Invalid group ID' }, { status: 400 });
	}

	const { groupId } = parseResult.data;

	try {
		const treatments = await db.treatment.findMany({
			where: { groupId },
		});

		return json(treatments, { status: 200 });
	} catch (err) {
		console.error('Error fetching treatments:', err);
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};
