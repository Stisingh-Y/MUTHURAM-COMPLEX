import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Builds a Prisma client with the driver adapter that matches DATABASE_URL.
 *
 * Kept separate from `src/lib/db.ts` so build-time scripts (the seed) can use
 * the exact same wiring as the running app without importing `server-only`.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  if (/^(postgres|postgresql):/i.test(databaseUrl)) {
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  }

  return new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
}
