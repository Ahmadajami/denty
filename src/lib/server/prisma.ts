import { PRISMA_DATABASE_URL } from '$env/static/private';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const db =
	global.prisma ||
	new PrismaClient({
		datasourceUrl: PRISMA_DATABASE_URL
	}).$extends(withAccelerate());

if (process.env.NODE_ENV === 'development') {
	global.prisma = db;
}

export { db };
