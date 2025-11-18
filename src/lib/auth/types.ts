//import type { UserRole } from '@prisma/client';
import { z } from 'zod/v4';
import { clinicSchema, medicalSchema } from './schema';

export type ClinicSchema = typeof clinicSchema;
export type MedicalSchema = typeof medicalSchema;

export type ClinicData = z.infer<typeof clinicSchema>;
export type MedicalData = z.infer<typeof medicalSchema>;




