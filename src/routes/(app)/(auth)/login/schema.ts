import { z } from 'zod/v4';
export const authschema = z.object({
	// Phone number validation: strips spaces/formatting logic should happen before or be handled loosely here if strictly numeric
	PhoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),

	password: z.string().min(1, 'Password is required')
	// Note: For login, we usually just check if it's not empty.
	// Strict length checks (e.g. min(8)) are for signup, but you can keep them if you prefer.
});
