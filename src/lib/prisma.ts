import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Skip Prisma initialization during build if no DATABASE_URL
  if (!process.env.DATABASE_URL) {
    return null as any;
  }
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
