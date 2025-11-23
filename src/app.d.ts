// See https://svelte.dev/docs/kit/types#app.d.ts

import type { AppUser } from '$lib/auth/user';
import type { PrismaClient } from '$lib/server/db/generated/prisma/client';


// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AppUser;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	var prisma: PrismaClient;
}

export {};
