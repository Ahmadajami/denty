// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				id: string;
				createdAt: Date;
				updatedAt: Date;
				userId: string;
				expiresAt: Date;
				token: string;
				ipAddress?: string | null;
				userAgent?: string | null;
				activeOrganizationId?: string | null;
			};
			user: {
				id: string;
				createdAt: Date;
				updatedAt: Date;
				email: string;
				emailVerified: boolean;
				name: string;
				image?: string | null;
				phoneNumber?: string | null;
				phoneNumberVerified?: boolean | null;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
