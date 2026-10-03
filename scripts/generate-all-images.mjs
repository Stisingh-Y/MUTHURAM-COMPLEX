/**
 * scripts/generate-all-images.mjs
 *
 * Auto-generates ALL product, brand, category and hero images for MUTHURAM COMPLEX
 * using the Gemini Imagen API directly.
 *
 * Usage:
 *   node scripts/generate-all-images.mjs
 *
 * Requirements:
 *   GEMINI_API_KEY env var  (set in .env or export inline)
 *
 * The script:
 *   1. Reads every image spec from /public/images/products/prompts.json
 *   2. Skips files that already exist on disk (safe to re-run)
 *   3. Throttles to 1.2s between requests to avoid 429 rate limits
 *   4. Stops cleanly if quota is exhausted and resumes from where it left off
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ── config ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, "..");
const PROMPTS_FILE = path.join(ROOT, "public", "images", "products", "prompts.json");
const PUBLIC_DIR = path.join(ROOT, "public");

function loadEnv(file) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)/.exec(line);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  } catch {}
}
loadEnv(".env");
loadEnv(".env.local");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set. Add it to .env or .env.local");
  process.exit(1);
}

// ── helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateImage(prompt, aspectRatio) {
  const body = JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio, addWatermark: false },
  });

  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;
    const req = https.request(
      url,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${data}`)); return; }
          try {
            const json = JSON.parse(data);
            const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
            if (!b64) reject(new Error("No image in response"));
            else resolve(b64);
          } catch (e) { reject(e); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── brand SVG logos ───────────────────────────────────────────────────────────

const BRANDS = [
  { slug: "vortex",     name: "VORTEX",     letter: "V", color: "#FF5A1F" },
  { slug: "strata",     name: "STRATA",     letter: "S", color: "#E10600" },
  { slug: "apexline",   name: "APEXLINE",   letter: "A", color: "#C8FF00" },
  { slug: "trailforge", name: "TRAILFORGE", letter: "T", color: "#00C2A8" },
  { slug: "ironhaus",   name: "IRONHAUS",   letter: "I", color: "#7DA7FF" },
  { slug: "nimbus",     name: "NIMBUS",     letter: "N", color: "#FFCB4F" },
  { slug: "driftline",  name: "DRIFTLINE",  letter: "D", color: "#FF7A44" },
  { slug: "meridian",   name: "MERIDIAN",   letter: "M", color: "#E8D5B0" },
];

function makeSvg(name, letter, accent, darkBg) {
  const bg = darkBg ? "#111214" : "#F2F0EB";
  const fg = darkBg ? "#F2F0EB" : "#111214";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <rect width="320" height="120" fill="${bg}"/>
  <rect x="0" y="0" width="6" height="120" fill="${accent}"/>
  <text x="28" y="82" font-family="Arial Black,Arial,sans-serif" font-size="64" font-weight="900" fill="${accent}" letter-spacing="-2">${letter}</text>
  <text x="102" y="58" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="${fg}" letter-spacing="4">${name}</text>
  <text x="103" y="78" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="400" fill="${fg}" opacity="0.5" letter-spacing="5">MOTO GEAR</text>
</svg>`;
}

function generateBrandSVGs() {
  let n = 0;
  for (const { slug, name, letter, color } of BRANDS) {
    const dir = path.join(PUBLIC_DIR, "images", "brands", slug);
    fs.mkdirSync(dir, { recursive: true });
    const dark = path.join(dir, "logo-dark.svg");
    const light = path.join(dir, "logo-light.svg");
    if (!fs.existsSync(dark))  { fs.writeFileSync(dark,  makeSvg(name, letter, color, true));  n++; }
    if (!fs.existsSync(light)) { fs.writeFileSync(light, makeSvg(name, letter, color, false)); n++; }
  }
  console.log(`Brand SVG logos: ${n} written`);
}

// ── master style ──────────────────────────────────────────────────────────────

const MASTER = "Professional e-commerce product photograph shot on a Canon EOS R5, 85mm f/2.8. Single product centered on dark charcoal seamless backdrop (#111214), large softbox key light from upper left, subtle warm orange rim light (#FF5A1F) from behind, soft natural floor reflection, realistic material texture, tack-sharp focus. No text, no logos, no watermarks. Ultra-photorealistic.";

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("MUTHURAM COMPLEX - Image Generator\n");
  generateBrandSVGs();

  const { images } = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8"));
  const todo = images.filter(({ file }) => !fs.existsSync(path.join(PUBLIC_DIR, file.replace(/^\//, ""))));

  console.log(`Images to generate: ${todo.length} / ${images.length}\n`);
  if (!todo.length) { console.log("All images exist. Done."); return; }

  let done = 0, failed = 0;

  for (const spec of todo) {
    const dest = path.join(PUBLIC_DIR, spec.file.replace(/^\//, ""));
    process.stdout.write(`  [${done + failed + 1}/${todo.length}] ${spec.file.split("/").slice(-2).join("/")} ... `);

    try {
      if (done > 0) await sleep(1200);
      const b64 = await generateImage(`${spec.prompt} ${MASTER}`, spec.aspect ?? "4:5");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(b64, "base64"));
      console.log("OK");
      done++;
    } catch (err) {
      console.log(`FAIL: ${err.message.slice(0, 80)}`);
      failed++;
      if (err.message.includes("429") || err.message.includes("QUOTA")) {
        console.error(`\nQuota exhausted. ${done} images saved. Re-run after quota resets.\n`);
        process.exit(1);
      }
    }
  }

  console.log(`\nDone: ${done} generated, ${failed} failed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
