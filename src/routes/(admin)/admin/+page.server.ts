/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from '$lib/server/prisma';

import { superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { treatmentGroupSchema, treatmentSchema } from '$lib/zod/treatment';
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// 1. Fetch all groups with their treatments nested
	const groups = await db.treatmentGroup.findMany({
		include: {
			treatments: true
		},
		orderBy: {
			nameEn: 'asc'
		}
	});

	// 2. Initialize forms
	const groupForm = await superValidate(zod4(treatmentGroupSchema));
	const treatmentForm = await superValidate(zod4(treatmentSchema));

	return {
		groups,
		groupForm,
		treatmentForm
	};
};

export const actions: Actions = {
    /* ------------------------------------------------------------------
       GROUP ACTIONS
       ------------------------------------------------------------------ */
    createGroup: async ({ request }) => {
        const form = await superValidate(request, zod4(treatmentGroupSchema));
        if (!form.valid) return fail(400, { form });

        try {
            await db.treatmentGroup.create({
                data: {
                    nameEn: form.data.nameEn,
                    nameAr: form.data.nameAr,
                    color: form.data.color
                }
            });
            return message(form, 'Group created successfully');
        } catch (error) {
            return message(form, 'Failed to create group. Name might be duplicate.', { status: 500 });
        }
    },

    deleteGroup: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        
        if (!id) return fail(400, { error: 'Missing ID' });

        try {
            // Because we added 'onDelete: Cascade' in schema.prisma,
            // deleting the group will automatically delete all its treatments.
            await db.treatmentGroup.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            console.error('Error deleting group:', error);
            return fail(500, { error: 'Could not delete group' });
        }
    },

    /* ------------------------------------------------------------------
       TREATMENT ACTIONS
       ------------------------------------------------------------------ */
    createTreatment: async ({ request }) => {
        const form = await superValidate(request, zod4(treatmentSchema));
        if (!form.valid) return fail(400, { form });

        try {
            await db.treatment.create({
                data: {
                    nameEn: form.data.nameEn,
                    nameAr: form.data.nameAr,
                    groupId: form.data.groupId
                    // Note: basePrice is removed from schema
                }
            });
            return message(form, 'Treatment added successfully');
        } catch (error) {
            console.error('Error creating treatment:', error);
            return message(form, 'Failed to add treatment', { status: 500 });
        }
    },

    deleteTreatment: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) return fail(400, { error: 'Missing ID' });

        try {
            await db.treatment.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            return fail(500, { error: 'Could not delete treatment' });
        }
    }
};
