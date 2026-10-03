/**
 * Generates `prisma/schema.sqlite.prisma` from the canonical PostgreSQL
 * schema so local development can run on SQLite while production stays on
 * PostgreSQL.
 *
 * The generated file only ever differs by the datasource provider and the
 * generator output path (the client is generated from the PostgreSQL schema
 * so runtime types are identical in both environments).
 *
 * Run with: npm run db:schema
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "prisma", "schema.prisma");
const target = path.join(root, "prisma", "schema.sqlite.prisma");

const banner = [
  "// GENERATED FILE — do not edit.",
  "// Source: prisma/schema.prisma  (regenerate with `npm run db:schema`)",
  "",
].join("\n");

const schema = await readFile(source, "utf8");

if (!/^datasource db \{\s*provider = "postgresql"/m.test(schema)) {
  throw new Error("Expected the canonical schema to use the postgresql provider.");
}

const sqliteSchema = schema.replace(
  /^datasource db \{\s*provider = "postgresql"/m,
  'datasource db {\n  provider = "sqlite"',
);

await writeFile(target, banner + sqliteSchema, "utf8");
console.log("Wrote prisma/schema.sqlite.prisma");