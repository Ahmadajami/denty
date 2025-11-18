// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ClinicOwner, MedicalCenterDoctor, MedicalCenterOwner } from '$lib/auth/user';

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
}

export {};
