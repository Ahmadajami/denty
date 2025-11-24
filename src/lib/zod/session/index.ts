import { z } from 'zod/v4';

// --- CONSTANTS ---
const SYRIAN_PHONE_REGEX = /^\+963[\d\s]+$/;

export const ToothTreatmentSchema = z.object({
    toothNumber: z.number().int().min(1).max(32),
    treatmentId: z.string(),
    notes: z.string().optional()
});

// --- STEP 1: Patient Info (Phone) ---
export const reportStep0 = z.object({
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(16, 'Phone number must be no more than 16 digits')
        .regex(SYRIAN_PHONE_REGEX, 'Phone number must be a valid Syrian number starting with +963')
});

// --- STEP 2: Tooth & Treatments ---
// Extends Step 0 so that we validate the phone AND the treatments
export const reportStep1 = reportStep0.extend({
    toothTreatments: z
        .array(ToothTreatmentSchema)
        .min(1, 'At least one tooth must be selected with its treatments.')
});

// --- STEP 3: Review (Final Submission) ---
// Identical to Step 1 as it just confirms existing data
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