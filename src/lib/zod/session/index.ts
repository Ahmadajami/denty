import { z } from 'zod';

// --- CONSTANTS ---
// Regex for Syrian numbers (e.g. +963 9xx xxx xxx)
const SYRIAN_PHONE_REGEX = /^\+963[\d\s]+$/;

// Schema for a single "Tooth + Treatment" selection
export const ToothTreatmentSchema = z.object({
	toothNumber: z.number().int().min(1).max(90),
	treatmentId: z.string().min(1, 'Treatment is required'),
	notes: z.string().optional()
});

// --- STEP 1: Patient Info (Phone) ---
export const reportStep0 = z.object({
	phone: z
		.string()
		.min(10, 'Phone number must be at least 10 digits')
		.max(17, 'Phone number must be no more than 17 digits')
		// Removing strict regex if you want to allow flexibility,
		// or keep it if your user base is strictly Syrian numbers.
		.regex(SYRIAN_PHONE_REGEX, 'Phone number must be a valid Syrian number starting with +963')
});

// --- STEP 2: Tooth & Treatments & Price ---
// We extend Step 0 so the final form object accumulates all data
export const reportStep1 = reportStep0.extend({
	toothTreatments: z
		.array(ToothTreatmentSchema)
		.min(1, 'At least one tooth must be selected with its treatments.'),

	// ⚠️ Added: Required by your DB model (TreatmentSession.price)
	totalPrice: z.coerce.number().min(0, 'Price cannot be negative').default(0)
});

// --- STEP 3: Review (Final Submission) ---
// Identical to Step 1 for validation purposes
export const reportLastStep = reportStep1;

export const reviewStep = reportLastStep;

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
