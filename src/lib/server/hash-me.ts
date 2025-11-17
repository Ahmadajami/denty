import bcrypt from 'bcrypt';
export async function hashMe(password: string) {
	const p = await bcrypt.hash(password, 10);
	return p;
}
