import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// In development, `nodemon`/module reloads can otherwise instantiate a new
// PrismaClient (and a new connection pool) on every file change. Caching the
// instance on `globalThis` survives those reloads. In production/test, each
// process gets exactly one client for its lifetime, so the cache is a no-op.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (!env.isProduction) {
  globalForPrisma.__prisma = prisma;
}
