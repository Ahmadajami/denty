// treatment-group.service.ts
import { db } from '$lib/server/prisma';
import { TreatmentByGroupSchema } from '$lib/zod/treatment';

/**
 * Get all treatments belonging to a specific group
 */
export async function getTreatmentsByGroup(input: unknown) {
	const { groupId } = TreatmentByGroupSchema.parse(input);

	return db.treatment.findMany({
		where: {
			groupId
		},
		orderBy: {
			name: 'asc'
		}
	});
}

export async function getAllTreatmentsGroups() {
	const groups = await db.treatmentGroup.findMany({
		orderBy: {
			name: 'asc'
		},
		select: {
			id: true,
			color: true,
			name: true,
			nameAr: true
		}
	});

	return groups;
}
