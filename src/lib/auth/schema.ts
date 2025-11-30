import { m } from '$lib/paraglide/messages';
import { z } from 'zod/v4'; // Note: SvelteKit usually uses standard zod, not zod/v4 unless specific adapter requires it

/* -------------------------------------------------
   CONSTANTS & ENUMS
   -------------------------------------------------
*/
export const SPECIALIZATION_TYPES = [
	'Empty',
	'General Dentist',
	'Orthodontist',
	'Periodontist',
	'Prosthodontist',
	'Endodontist',
	'Oral Surgeon',
	'Pediatric Dentist',
	'Other'
] as const;

// Helper for specialization validation
const SpecializationEnum = z
	.enum(SPECIALIZATION_TYPES)
	.default('Empty')
	.refine((val) => val !== 'Empty', m.specialization_wrong());

/* -------------------------------------------------
   BASE SCHEMA
   -------------------------------------------------
*/
const personBaseSchema = z.object({
	// Map to Prisma: nameAr
	name_ar: z.string().trim().min(2, m.doctor_error()),
	// Map to Prisma: nameEn
	name: z.string().trim().min(2, m.doctor_error()),
	// Map to Prisma: phoneNumber
	phone: z.string().min(10, m.phonenumber_error()),
	// Map to Prisma: specialization
	specialization: SpecializationEnum,
	// Map to Prisma: passwordHash
	password: z.string().min(8, m.password_error()).max(100, m.password_error_second()),
	password_confirmation: z.string()
});

/* -------------------------------------------------
   CLINIC SCHEMA
   -------------------------------------------------
*/
export const clinicSchema = personBaseSchema
	.extend({
		// Map to Prisma: Clinic.name
		clinicName: z.string().trim().min(2, m.center_error())
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: m.confirm_password_error(),
		path: ['password_confirmation']
	});

export type ClinicSchema = typeof clinicSchema;

/* -------------------------------------------------
   MEDICAL CENTER SCHEMA (Preserved structure)
   -------------------------------------------------
*/
// Re-define doctor schema based on base
const doctorSchema = personBaseSchema.refine(
	(data) => data.password === data.password_confirmation,
	{
		message: m.confirm_password_error(),
		path: ['password_confirmation']
	}
);

export const medicalSchema = z
	.object({
		name_ar: z.string().trim().min(2, m.doctor_error()),
		name: z.string().trim().min(2, m.doctor_error()),
		center_name: z.string().trim().min(2, m.center_error()),
		center_name_ar: z.string().trim().min(2, m.center_error()), // Note: Prisma doesn't have center_name_ar in Facility? Check if needed.
		specialization: SpecializationEnum,
		phone: z.string().min(10, m.phonenumber_error()),
		password: z.string().min(8, m.password_error()).max(100, m.password_error_second()),
		password_confirmation: z.string(),
		doctors: z.array(doctorSchema).min(2, m.center_doctor_count_error())
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: m.confirm_password_error(),
		path: ['password_confirmation']
	});
export type MedicalSchema = typeof medicalSchema;