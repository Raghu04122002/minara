import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const localUrl = process.env.LOCAL_DATABASE_URL;
  const localDirectUrl = process.env.LOCAL_DIRECT_URL;
  const prodUrl = process.env.DATABASE_URL;
  const prodDirectUrl = process.env.DIRECT_URL;

  // Prioritize local database URL for development environment
  const targetUrl = localUrl || prodUrl;
  const targetDirectUrl = localDirectUrl || prodDirectUrl;

  if (targetUrl) {
    process.env.DATABASE_URL = targetUrl;
  }
  if (targetDirectUrl) {
    process.env.DIRECT_URL = targetDirectUrl;
  }

  console.log(`[PRISMA] Using database: ${targetUrl?.includes('localhost') ? 'LOCAL' : 'REMOTE'}`);

  return new PrismaClient({
    datasources: {
      db: {
        url: targetUrl,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
