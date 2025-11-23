import 'dotenv/config';
import { PrismaClient } from '$lib/server/db/generated/prisma/client'; // Prisma v7 path
import { withAccelerate } from '@prisma/extension-accelerate';
import { PRISMA_DATABASE_URL } from '$env/static/private';
import { dev } from '$app/environment';

const db =
	globalThis.prisma ||
	new PrismaClient({
		accelerateUrl: PRISMA_DATABASE_URL
	}).$extends(withAccelerate());

if (dev) globalThis.prisma = db;

export { db };
