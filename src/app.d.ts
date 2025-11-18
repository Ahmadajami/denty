// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ClinicOwner, MedicalCenterDoctor, MedicalCenterOwner } from '$lib/auth/user';
import type { PrismaClient } from '@prisma/client';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: ClinicOwner | MedicalCenterOwner | MedicalCenterDoctor | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	var prisma: PrismaClient;
}

export {};
