import { prisma } from '../lib/prisma.js';
import { logger } from './logger.js';

export async function connectDatabase() {
  await prisma.$connect();
  logger.info('Database connection established');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return false;
  }
}
