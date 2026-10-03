import { defineConfig } from "@prisma/config";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Prisma 7 does not load `.env` files on its own, so we parse the two files we
 * care about before anything reads `process.env`. Values already present in the
 * environment always win.
 */
function loadEnvFile(file: string): void {
  let raw: string;
  try {
    raw = readFileSync(path.join(process.cwd(), file), "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = (match[2] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

/**
 * The active datasource is derived from DATABASE_URL so that a single command
 * surface works for local SQLite development and PostgreSQL in production:
 *
 *   file:... / libsql:...  ->  prisma/schema.sqlite.prisma   (dev)
 *   postgres://...         ->  prisma/schema.prisma          (production)
 *
 * `prisma/schema.prisma` is the source of truth (PostgreSQL, the production
 * target). `prisma/schema.sqlite.prisma` is generated from it by
 * `npm run db:schema` and must never be edited by hand.
 */
const databaseUrl = process.env.DATABASE_URL ?? "";
const provider: "sqlite" | "postgresql" = /^(postgres|postgresql):/i.test(databaseUrl)
  ? "postgresql"
  : "sqlite";

export default defineConfig({
  schema: provider === "postgresql" ? "prisma/schema.prisma" : "prisma/schema.sqlite.prisma",
  migrations: {
    path: provider === "postgresql" ? "prisma/migrations" : "prisma/migrations-sqlite",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});