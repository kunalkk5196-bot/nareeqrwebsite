import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();

export async function checkDatabaseConnection(): Promise<boolean> {
  if (config.mockMode) {
    logger.info('MOCK MODE: Using in-memory relational data store.');
    return true;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Connected to PostgreSQL successfully via Prisma Client');
    return true;
  } catch (error: any) {
    logger.error({ err: error.message }, 'Failed to connect to PostgreSQL database via Prisma');
    return false;
  }
}
