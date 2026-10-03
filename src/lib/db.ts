import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db-factory";
import { serverEnv } from "@/lib/env";

/**
 * Single Prisma client for the running app.
 *
 * `globalThis` caching prevents a new connection pool on every hot reload in
 * `next dev`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient(serverEnv().databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
