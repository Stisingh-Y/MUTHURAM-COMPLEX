/**
 * Sanity-checks the generated placeholder images: correct dimensions, and
 * enough tonal variance that the plate is not rendering as a flat fill.
 * Run: npx tsx scripts/verify-images.ts
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = path.join(root, "public", "media");

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

const EXPECTED: Record<string, { width: number; height: number }> = {
  "demo/hero-01.jpg": { width: 2400, height: 1350 },
  "demo/hero-01-mobile.jpg": { width: 1200, height: 1600 },
  "demo/promo-monsoon.jpg": { width: 1800, height: 1200 },
  "demo/promo-genuine.jpg": { width: 1800, height: 1200 },
  "demo/promo-track.jpg": { width: 1800, height: 1200 },
  "demo/og-default.jpg": { width: 1200, height: 630 },
};

interface Check {
  file: string;
  mean: number;
  spread: number;
  accentHits: number;
}

async function main(): Promise<void> {
  const files = (await walk(mediaDir)).filter((file) => file.endsWith(".jpg"));
  const problems: string[] = [];
  const checks: Check[] = [];

  for (const file of files) {
    const relative = file.slice(mediaDir.length + 1).split(path.sep).join("/");
    const image = sharp(file);
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    const expected = EXPECTED[relative];
    if (expected && (width !== expected.width || height !== expected.height)) {
      problems.push(
        `${relative}: expected ${expected.width}x${expected.height}, got ${width}x${height}`,
      );
    }
    if (width === 0 || height === 0) {
      problems.push(`${relative}: missing dimensions`);
      continue;
    }

    const { channels } = await image.stats();
    const mean = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
    const spread = channels.reduce((sum, channel) => sum + channel.stdev, 0) / channels.length;

    // A flat fill has a standard deviation near zero; real artwork does not.
    if (spread < 8) problems.push(`${relative}: near-flat render (stdev ${spread.toFixed(1)})`);
    if (mean < 3 || mean > 250) {
      problems.push(`${relative}: extreme mean luminance ${mean.toFixed(1)}`);
    }

    // Count accent-orange pixels so we know the art layer actually rendered.
    const raw = await image
      .clone()
      .resize(120, Math.max(1, Math.round((120 * height) / width)), { fit: "fill" })
      .raw()
      .toBuffer();

    let accentHits = 0;
    for (let i = 0; i < raw.length; i += 3) {
      const r = raw[i] ?? 0;
      const g = raw[i + 1] ?? 0;
      const b = raw[i + 2] ?? 0;
      if (r > 180 && g > 50 && g < 160 && b < 110) accentHits += 1;
    }

    checks.push({
      file: relative,
      mean: Number(mean.toFixed(1)),
      spread: Number(spread.toFixed(1)),
      accentHits,
    });
  }

  const placeholders = JSON.parse(
    await readFile(path.join(root, "src", "generated", "image-placeholders.json"), "utf8"),
  ) as Record<string, string>;

  const missingLqip = files
    .map((file) => `/media/${file.slice(mediaDir.length + 1).split(path.sep).join("/")}`)
    .filter((url) => !(url in placeholders));

  if (missingLqip.length > 0) {
    problems.push(
      `Missing LQIP entries for ${missingLqip.length} image(s), e.g. ${missingLqip.slice(0, 3).join(", ")}`,
    );
  }

  const noAccent = checks.filter((check) => check.accentHits === 0);
  const average = (pick: (check: Check) => number) =>
    (checks.reduce((sum, check) => sum + pick(check), 0) / Math.max(1, checks.length)).toFixed(1);

  console.log(`Checked ${files.length} images.`);
  console.log(`  LQIP entries      : ${Object.keys(placeholders).length}`);
  console.log(`  Mean luminance    : ${average((c) => c.mean)}`);
  console.log(`  Mean spread (stdev): ${average((c) => c.spread)}`);
  console.log(`  With accent pixels: ${checks.length - noAccent.length} / ${checks.length}`);
  if (noAccent.length > 0) {
    console.log(`  Plates without accent-orange (expected for neutral-accent art):`);
    for (const check of noAccent.slice(0, 8)) console.log(`    - ${check.file}`);
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems.slice(0, 30)) console.error(`  ! ${problem}`);
    process.exit(1);
  }

  console.log("\nAll image checks passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
