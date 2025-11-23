import { z } from 'zod/v4';

// --- ZOD SCHEMAS & TYPES ---

/**
 * Zod Schema for a Patient entity (variable).
 * Refactored to camelCase (patientSchema).
 */
export const patientSchema = z.object({
	// <-- camelCase for schema variable
	// Standard ID field
	id: z.number().int().positive(),

	// Enforcing MANDATORY international format:
	phone: z
		.string()
		.min(8)
		.regex(
			/^\+963[\d\s]+$/,
			"Must be a valid international phone number (starting with '+' and country code)"
		),

	// Full names in Latin and Arabic scripts (camelCase for fields)
	fullname: z.string().min(3),
	fullnameAr: z.string().min(3),

	// Optional fields
	age: z.number().int().positive().optional(),
	allergies: z.array(z.string().min(1)).optional()
});

/**
 * TypeScript Type for the Patient data structure.
 * Uses PascalCase (PatientType) for types.
 */
export type PatientType = z.infer<typeof patientSchema>;

/**
 * TypeScript Type for the Superform schema itself.
 * Uses PascalCase with a 'Schema' suffix (PatientFormSchema).
 */
export type PatientFormSchema = typeof patientSchema;

// Schema for creating a patient (ID is optional)
// Refactored to camelCase (crudPatientSchema)
export const crudPatientSchema = patientSchema.extend({
	// <-- camelCase for schema variable
	id: patientSchema.shape.id.optional()
});

/**
 * TypeScript Type for the Add/Create Patient form schema.
 * Uses PascalCase (CreatePatientFormSchema).
 */
export type CreatePatientFormSchema = typeof crudPatientSchema;
