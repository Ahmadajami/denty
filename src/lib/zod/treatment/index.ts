import { z } from 'zod'; // ✅ Refactored import from 'zod/v4'

// --- CONSTANTS ---
const SYRIAN_PHONE_REGEX = /^\+963[\d\s]+$/;

// ===============================================
// 🦷 PLACEHOLDER: ToothTreatmentSchema
// ⚠️ IMPORTANT: Replace this with your actual schema definition
// that includes fields like tooth ID, surface, and treatment details.
// ===============================================

/**
 * Placeholder Schema for a Treatment linked to a specific Tooth.
 * This is defined minimally to allow the rest of the code to run.
 */
export const ToothTreatmentSchema = z.object({
    toothNumber: z.number().int().min(1).max(32),
    treatmentId: z.string(),
    notes: z.string().optional(),
});


// ===============================================
// 💊 Treatment Schemas (Core CRUD)
// ===============================================

/**
 * Zod Schema for a Treatment entity (variable).
 * Defines the MANDATORY fields as they exist in the database.
 */
export const treatmentSchema = z.object({
    // Standard ID field
    id: z.string(), // ✅ Use z.string() for consistency with Prisma
    
    // Full names in Latin and Arabic scripts (camelCase for fields)
    name: z.string().min(1, "English name is required."),
    // Removed z.string().min(1) on nameAr since Prisma defines it as Optional (String?)
    nameAr: z.string().nullable().optional(), 

    // Relation to Group (Mandatory Foreign Key)
    groupId: z.string().min(1, "Group ID is required."),

    // Optional: Base price (Prisma Decimal? -> treated as number or null here)
    // Coerce handles string inputs from forms, converting them to numbers.
    basePrice: z.coerce.number().nonnegative("Price must be non-negative.").nullable().optional().default(0.0),

    // Auto-generated fields (Read-Only)
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * TypeScript Type for the Treatment data structure (the full DB object).
 */
export type TreatmentType = z.infer<typeof treatmentSchema>;

// --- CRUD Schemas ---

/**
 * Zod Schema for creating/adding a Treatment (ID and auto-fields are removed/optional).
 */
export const crudTreatmentSchema = treatmentSchema.omit({
    id: true, 
    createdAt: true,
    updatedAt: true,
}).extend({
    // Retain coerce for forms, and ensure it's optional
    basePrice: z.coerce.number().nonnegative("Price must be non-negative.").nullable().optional(),
});

/**
 * TypeScript Type for the Add/Create Treatment form data.
 */
export type CreateTreatmentType = z.infer<typeof crudTreatmentSchema>;

/**
 * Zod Schema for updating a Treatment.
 */
export const updateTreatmentSchema = crudTreatmentSchema.partial().extend({
    id: z.string(), // ID is required for WHERE clause and should be a valid CUID
});

/**
 * TypeScript Type for the Update Treatment form data.
 */
export type UpdateTreatmentType = z.infer<typeof updateTreatmentSchema>;


// ===============================================
// 🩺 Report Step Schemas
// ===============================================

export const GlobalTreatmentsSchema = z.object({
    isGlobal: z.literal(true), // Ensures this schema is only valid if isGlobal is exactly true

    // Note: Use the full 'treatmentSchema' here only if the form sends the whole DB object.
    // If the form only sends the IDs, you would adjust the array type.
    treatments: z.array(treatmentSchema).min(1, 'At least one global treatment must be selected')
});

export const reportStep0 = z.object({
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(16, 'Phone number must be no more than 16 digits')
        .regex(SYRIAN_PHONE_REGEX, 'Phone number must be a valid Syrian number starting with +963')
});

export const reportStep1 = reportStep0; // Same as step 0 for now

export const reportLastStep = reportStep1.extend({
    toothTreatments: z
        .array(ToothTreatmentSchema) // ✅ Now works due to placeholder schema
        .min(1, 'At least one tooth must be selected with its treatments.'),

    globalTreatments: z.optional(GlobalTreatmentsSchema)
});

export const reviewStep = reportLastStep; // Same as last step for now

// ===============================================
// 📝 Exported Types
// ===============================================

export type Step0Data = z.infer<typeof reportStep0>;
export type Step0Form = typeof reportStep0;

export type Step1Data = z.infer<typeof reportStep1>;
export type Step1Form = typeof reportStep1;

export type LastStepData = z.infer<typeof reportLastStep>;
export type LastStepForm = typeof reportLastStep;

export type ReviewStepData = z.infer<typeof reviewStep>;
export type ReviewStepForm = typeof reviewStep;

export type ToothTreatmentData = z.infer<typeof ToothTreatmentSchema>;
export type GlobalTreatmentsData = z.infer<typeof GlobalTreatmentsSchema>;