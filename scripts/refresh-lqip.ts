import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/**
 * Rebuilds `src/generated/image-placeholders.json` from every JPEG currently
 * under `public/media` (both `demo/` and `real/`).
 *
 * This is the drop-in step for real photography: save the supplier/brand photo
 * over (or beside) the demo file at the matching aspect ratio, point the
 * catalogue row at its URL, run this script, and `next/image` blur placeholders
 * keep working with no component changes.
 *
 * Run: npx tsx scripts/refresh-lqip.ts
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = path.join(root, "public", "media");
const placeholderPath = path.join(root, "src", "generated", "image-placeholders.json");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return nested.flat();
}

async function main(): Promise<void> {
  const files = (await walk(mediaDir)).filter((file) => file.endsWith(".jpg"));
  const placeholders: Record<string, string> = {};

  for (const file of files) {
    const relative = file.slice(mediaDir.length + 1).split(path.sep).join("/");
    const meta = await sharp(file).metadata();
    const lqip = await sharp(file)
      .resize(20, Math.max(1, Math.round((20 * (meta.height ?? 3)) / (meta.width ?? 4))), {
        fit: "cover",
      })
      .jpeg({ quality: 42 })
      .toBuffer();
    placeholders[`/media/${relative}`] = `data:image/jpeg;base64,${lqip.toString("base64")}`;
  }

  await writeFile(placeholderPath, `${JSON.stringify(placeholders, null, 0)}\n`, "utf8");
  console.log(`Wrote ${files.length} LQIP entries from public/media.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
