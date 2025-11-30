import { db } from '$lib/server/prisma';
import { z } from 'zod';

// Simple schema just for ID validation
const idSchema = z.object({ id: z.string() });

/**
 * Get all treatments belonging to a specific group
 */
export async function getTreatmentsByGroup(input: unknown) {
    // FIX: Only validate the ID, not the entire group object
    const { id } = idSchema.parse(input);

    return db.treatment.findMany({
        where: {
            groupId: id
        },
        orderBy: {
            nameEn: 'asc'
        }
    });
}

/**
 * Get just the groups (for dropdowns/lists)
 */
export async function getAllTreatmentsGroups() {
    return db.treatmentGroup.findMany({
        select: {
            id: true,
            color: true,
            nameEn: true,
            nameAr: true
        },
        orderBy: {
            nameEn: 'asc'
        }
    });
}

/**
 * NEW: Get Groups WITH their Treatments
 * Essential for the Session Page Catalog UI
 */
export async function getCatalog() {
    return db.treatmentGroup.findMany({
        include: {
            treatments: {
                select: {
                    id: true,
                    nameEn: true,
                    nameAr: true
                },
                orderBy: {
                    nameEn: 'asc'
                }
            }
        },
        orderBy: {
            nameEn: 'asc'
        }
    });
}