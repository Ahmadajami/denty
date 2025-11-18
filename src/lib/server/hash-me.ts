/***
 * THIS FILE IS CREATED FOR TYPING BCRYPT
 *
 */

import bcrypt from 'bcrypt';
export async function hashMe(password: string) {
	const p = await bcrypt.hash(password, 10);
	return p;
}

export async function verifyMe(password: string, hash: string) {
	return await bcrypt.compare(password, hash);
}
