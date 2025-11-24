import { z } from 'zod/v4';

// --- CONSTANTS ---
const SYRIAN_PHONE_REGEX = /^\+963[\d\s]+$/;

export const ToothTreatmentSchema = z.object({
	toothNumber: z.number().int().min(1).max(32),
	treatmentId: z.string(),
	notes: z.string().optional()
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
		.min(1, 'At least one tooth must be selected with its treatments.')
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
