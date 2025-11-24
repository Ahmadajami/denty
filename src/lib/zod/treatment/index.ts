import { z } from 'zod/v4';

export const TreatmentGroupSchema = z.object({
	id: z.string().optional(), // auto-generated on create
	name: z.string().min(1, 'Group name is required'),
	nameAr: z.string().optional(),
	color: z.string().min(1, 'Color is required'),

	// timestamps
	createdAt: z.date().optional(),
	updatedAt: z.date().optional()
});

// For creating a new group
export const TreatmentGroupCreateSchema = TreatmentGroupSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

// For updating (all optional)
export const TreatmentGroupUpdateSchema = TreatmentGroupSchema.partial();

export const TreatmentSchema = z.object({
	id: z.string().cuid().optional(), // auto-generated
	name: z.string().min(1, 'Treatment name is required'),
	nameAr: z.string().optional(),

	// relation
	groupId: z.string().cuid(),

	// Prisma Decimal → accept number or string
	basePrice: z.union([z.number(), z.string()]).optional(),

	createdAt: z.date().optional(),
	updatedAt: z.date().optional()
});

// For creating a new treatment
export const TreatmentCreateSchema = TreatmentSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

// For updating treatment
export const TreatmentUpdateSchema = TreatmentSchema.partial();
export const TreatmentWithGroupSchema = TreatmentSchema.extend({
	group: TreatmentGroupSchema
});

export const TreatmentGroupWithTreatmentsSchema = TreatmentGroupSchema.extend({
	treatments: z.array(TreatmentSchema)
});
//read thsi
export const TreatmentGroupSearchSchema = z.object({
  query: z.string().optional(), // partial match on group name
});

export const TreatmentByGroupSchema = z.object({
  groupId: z.string(),
});