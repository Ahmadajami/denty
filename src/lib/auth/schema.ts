import { m } from '$lib/paraglide/messages';
import { z } from 'zod/v4';
/*
Login Schema
*/
export const authschema = z.object({
	PhoneNumber: z.string().min(10, m.phonenumber_error()),
	password: z.string().min(8, m.password_error())
});

// Define the enum for specialization.
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

// Zod Enum schema for specialization.
const SpecializationEnum = z
	.enum(SPECIALIZATION_TYPES)
	.default('Empty')
	.refine((val) => val !== 'Empty', m.specialization_wrong());
// --- Reusable base schema ---
const personBaseSchema = z
	.object({
		name_ar: z.string().trim().min(2, m.doctor_error()),
		name: z.string().trim().min(2, m.doctor_error()),
		phone: z.string().min(10, m.phonenumber_error()),
		specialization: SpecializationEnum,
		password: z.string().min(8, m.password_error()).max(100, m.password_error_second()),
		password_confirmation: z.string()
	})
	.check((ctx) => {
		if (ctx.value.password !== ctx.value.password_confirmation) {
			ctx.issues.push({
				code: 'custom',
				message: m.confirm_password_error(),
				path: ['password_confirmation'],
				input: ctx.value
			});
		}
	});

// --- Doctor Schema (only uses base schema) ---
const doctorSchema = personBaseSchema;

// --- Medical Schema ---
export const medicalSchema = z
	.object({
		name_ar: z.string().trim().min(2, m.doctor_error()),
		name: z.string().trim().min(2, m.doctor_error()),

		center_name: z.string().trim().min(2, m.center_error()),

		center_name_ar: z.string().trim().min(2, m.center_error()),
		specialization: SpecializationEnum,
		phone: z.string().min(10, m.phonenumber_error()),
		password: z.string().min(8, m.password_error()).max(100, m.password_error_second()),
		password_confirmation: z.string(),

		doctors: z
			.array(doctorSchema)
			.min(2, m.center_doctor_count_error())
			.default([
				{
					name_ar: '',
					name: '',
					phone: '',
					specialization: 'Empty',
					password: '',
					password_confirmation: ''
				},
				{
					name_ar: '',
					name: '',
					phone: '',
					specialization: 'Empty',
					password: '',
					password_confirmation: ''
				}
			])
	})
	.check((ctx) => {
		if (ctx.value.password !== ctx.value.password_confirmation) {
			ctx.issues.push({
				code: 'custom',
				message: m.confirm_password_error(),
				path: ['password_confirmation'],
				input: ctx.value
			});
		}
	});

// --- Clinic Schema ---
export const clinicSchema = personBaseSchema
	.safeExtend({
		clinicName: z.string().trim().min(2, m.center_error()),
		password: z.string().min(8, m.gross_fancy_worm_flop()).max(100, m.password_error_second()),
		password_confirmation: z.string()
	})
	.superRefine(({ password, password_confirmation }, ctx) => {
		if (password !== password_confirmation) {
			ctx.addIssue({
				code: 'custom',
				message: m.confirm_password_error(),
				path: ['password_confirmation']
			});
		}
	});
