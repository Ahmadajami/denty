import { z } from 'zod/v4';

// Schema for Creating/Editing a Group
export const treatmentGroupSchema = z.object({
	id: z.string().optional(), // Optional for create, required for edit
	nameEn: z.string().min(1, 'English name is required'),
	nameAr: z.string().optional(),
	color: z.string().min(1, 'Color is required').regex(/^#/, 'Must be a valid Hex color')
});

// Schema for Creating/Editing a Treatment
export const treatmentSchema = z.object({
	id: z.string().optional(),
	nameEn: z.string().min(1, 'English name is required'),
	nameAr: z.string().optional(),
	// Coerce converts the HTML input string to a number automatically
	basePrice: z.coerce.number().min(0, 'Price cannot be negative').default(0),
	groupId: z.string().min(1, 'Group ID is required')
});

export type TreatmentGroupSchema = typeof treatmentGroupSchema;
export type TreatmentSchema = typeof treatmentSchema;
