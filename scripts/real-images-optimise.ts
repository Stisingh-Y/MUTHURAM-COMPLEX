import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RI = path.join(root, "real-images");

type Row = { slug: string; src: string; alt: string; reused: boolean };

// 16 direct matches (type + colour), 16 reuses flagged below.
const ROWS: Row[] = [
  { slug: "vortex-r9-modular-helmet", src: "helmets/helmets-matte-black-bluetooth-1.jpg", alt: "Matte black modular motorcycle helmet with bluetooth unit, side view", reused: false },
  { slug: "vortex-r5-full-face-helmet", src: "helmets/helmets-black-red-agvt-1.jpg", alt: "Black and red full-face motorcycle helmet, side view", reused: false },
  { slug: "meridian-atelier-no-1-helmet", src: "helmets/helmets-black-green-tork-1.jpg", alt: "Black and green full-face motorcycle helmet, rear three-quarter view", reused: false },
  { slug: "vortex-trail-adventure-helmet", src: "helmets/helmets-yellow-rpha70-shuky-1.jpg", alt: "Yellow and black adventure motorcycle helmet, front three-quarter view", reused: false },
  { slug: "strata-vantage-airflow-mesh-jacket", src: "jackets/jackets-black-leather-racing-1.jpg", alt: "Black leather racing motorcycle jacket with red trim, front view", reused: false },
  { slug: "strata-stormguard-waterproof-jacket", src: "jackets/jackets-brown-black-cafe-racer-1.jpg", alt: "Brown and black cafe-racer leather motorcycle jacket, front view", reused: false },
  { slug: "strata-torch-heated-jacket", src: "jackets/jackets-beige-leather-cafe-1.jpg", alt: "Beige leather motorcycle jacket with quilted shoulders, front view", reused: false },
  { slug: "strata-nimbus-rain-shell", src: "jackets/jackets-white-denim-casual-1.jpg", alt: "White casual motorcycle riding jacket, front view", reused: false },
  { slug: "apexline-talon-sport-gloves", src: "gloves/gloves-red-pro-biker-racing-1.jpg", alt: "Red and black racing motorcycle gloves with knuckle protection, top view", reused: false },
  { slug: "apexline-drygrip-summer-gloves", src: "gloves/gloves-black-steel-knuckle-1.jpg", alt: "Black motorcycle gloves with steel knuckle guards, top view", reused: false },
  { slug: "apexline-vantage-heated-gloves", src: "gloves/gloves-black-red-knuckle-1.jpg", alt: "Black and red motorcycle gloves with knuckle guards, top view", reused: false },
  { slug: "apexline-ridge-off-road-gloves", src: "gloves/gloves-black-green-monster-m20-1.jpg", alt: "Black and green off-road motorcycle gloves, top view", reused: false },
  { slug: "trailforge-shift-race-boot", src: "boots/boots-red-alpinestars-smx-1.jpg", alt: "Red and black racing motorcycle boots, side view", reused: false },
  { slug: "trailforge-voyager-tall-boot", src: "boots/boots-black-tech10-motocross-1.jpg", alt: "Black motocross motorcycle boots with orange accents, side view", reused: false },
  { slug: "trailforge-ridgeline-adventure-boot", src: "boots/boots-black-yellow-sidi-1.jpg", alt: "Black and yellow adventure motorcycle boots, side view", reused: false },
  { slug: "trailforge-street-ankle-boot", src: "boots/boots-black-red-sidi-race-1.jpg", alt: "Black and red motorcycle boots, side view", reused: false },
  // Riding pants have no dedicated photos: reuse jackets (closest apparel).
  { slug: "strata-ridge-textile-riding-pants", src: "jackets/jackets-black-leather-racing-1.jpg", alt: "Black leather motorcycle riding gear, front view", reused: true },
  { slug: "strata-monsoon-waterproof-pants", src: "jackets/jackets-brown-black-cafe-racer-1.jpg", alt: "Brown and black motorcycle riding gear, front view", reused: true },
  { slug: "strata-velocity-race-pants", src: "jackets/jackets-beige-leather-cafe-1.jpg", alt: "Beige motorcycle riding gear, front view", reused: true },
  { slug: "strata-base-layer-thermal-pants", src: "jackets/jackets-white-denim-casual-1.jpg", alt: "White motorcycle riding gear, front view", reused: true },
  // Protection has no dedicated photos: reuse gloves (closest protective gear).
  { slug: "ironhaus-vantage-back-protector", src: "gloves/gloves-black-steel-knuckle-1.jpg", alt: "Black protective motorcycle gear with armour, top view", reused: true },
  { slug: "ironhaus-chest-guard", src: "gloves/gloves-black-red-knuckle-1.jpg", alt: "Black and red protective motorcycle gear, top view", reused: true },
  { slug: "ironhaus-knee-slider-set", src: "gloves/gloves-red-pro-biker-racing-1.jpg", alt: "Red and black protective motorcycle gear, top view", reused: true },
  { slug: "ironhaus-elbow-shoulder-armour-set", src: "gloves/gloves-black-green-monster-m20-1.jpg", alt: "Black and green protective motorcycle gear, top view", reused: true },
  // Touring soft luggage: reuse jackets (soft textile goods).
  { slug: "trailforge-voyager-panniers", src: "jackets/jackets-beige-leather-cafe-1.jpg", alt: "Beige motorcycle soft luggage and textile gear, front view", reused: true },
  { slug: "driftline-bellows-tank-bag", src: "jackets/jackets-black-leather-racing-1.jpg", alt: "Black motorcycle soft luggage and textile gear, front view", reused: true },
  { slug: "trailforge-hydration-reservoir", src: "jackets/jackets-white-denim-casual-1.jpg", alt: "White motorcycle touring gear, front view", reused: true },
  { slug: "trailforge-handlebar-roll-bag", src: "jackets/jackets-brown-black-cafe-racer-1.jpg", alt: "Brown and black motorcycle touring gear, front view", reused: true },
  // Hard accessories: reuse boots/helmets (moulded hard goods).
  { slug: "driftline-auxiliary-spot-light-pair", src: "helmets/helmets-matte-black-bluetooth-1.jpg", alt: "Matte black motorcycle accessory, side view", reused: true },
  { slug: "driftline-machined-crash-guard", src: "boots/boots-black-tech10-motocross-1.jpg", alt: "Black motorcycle accessory, side view", reused: true },
  { slug: "driftline-braided-brake-clutch-line-kit", src: "boots/boots-black-red-sidi-race-1.jpg", alt: "Black and red motorcycle accessory, side view", reused: true },
  { slug: "driftline-led-tail-turn-kit", src: "helmets/helmets-black-red-agvt-1.jpg", alt: "Black and red motorcycle accessory, side view", reused: true },
];

const POOL: Record<string, string[]> = {
  helmets: ["helmets/helmets-matte-black-bluetooth-1.jpg", "helmets/helmets-black-red-agvt-1.jpg", "helmets/helmets-black-green-tork-1.jpg", "helmets/helmets-yellow-rpha70-shuky-1.jpg"],
  jackets: ["jackets/jackets-black-leather-racing-1.jpg", "jackets/jackets-brown-black-cafe-racer-1.jpg", "jackets/jackets-beige-leather-cafe-1.jpg", "jackets/jackets-white-denim-casual-1.jpg"],
  gloves: ["gloves/gloves-red-pro-biker-racing-1.jpg", "gloves/gloves-black-steel-knuckle-1.jpg", "gloves/gloves-black-red-knuckle-1.jpg", "gloves/gloves-black-green-monster-m20-1.jpg"],
  boots: ["boots/boots-red-alpinestars-smx-1.jpg", "boots/boots-black-tech10-motocross-1.jpg", "boots/boots-black-yellow-sidi-1.jpg", "boots/boots-black-red-sidi-race-1.jpg"],
};

async function convert(srcAbs: string, destAbs: string): Promise<number> {
  await mkdir(path.dirname(destAbs), { recursive: true });
  // Fit inside 1200x1500, never upscale, no crop, keep aspect ratio.
  const info = await sharp(srcAbs)
    .resize(1200, 1500, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destAbs);
  return info.size;
}

async function blurFor(srcAbs: string): Promise<string> {
  const buf = await sharp(srcAbs).resize(20, 25, { fit: "inside" }).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main(): Promise<void> {
  const blur: Record<string, string> = {};
  let over = 0;
  for (const row of ROWS) {
    const srcAbs = path.join(RI, row.src);
    const pool = POOL[row.src.split("/")[0]!]!;
    const start = pool.indexOf(row.src);
    // Gallery: main + next two pool images (detail/angle variety, same category).
    const gallerySrcs = [row.src, pool[(start + 1) % pool.length]!, pool[(start + 2) % pool.length]!];
    const names = ["main.webp", "detail.webp", "angle.webp"];
    for (let i = 0; i < 3; i++) {
      const dest = path.join(root, "public", "images", "products", row.slug, names[i]!);
      const bytes = await convert(path.join(RI, gallerySrcs[i]!), dest);
      if (bytes > 150 * 1024) { over++; console.log(`OVER BUDGET ${row.slug}/${names[i]} ${Math.round(bytes / 1024)}KB`); }
    }
    const mainUrl = `/images/products/${row.slug}/main.webp`;
    blur[mainUrl] = await blurFor(srcAbs);
    blur[`/images/products/${row.slug}/detail.webp`] = await blurFor(path.join(RI, gallerySrcs[1]!));
    blur[`/images/products/${row.slug}/angle.webp`] = await blurFor(path.join(RI, gallerySrcs[2]!));
    const st = await stat(path.join(root, "public", "images", "products", row.slug, "main.webp"));
    console.log(`${row.slug} main=${Math.round(st.size / 1024)}KB${row.reused ? " (reused)" : ""}`);
  }
  await writeFile(path.join(root, "src", "generated", "real-image-blur.json"), `${JSON.stringify(blur)}\n`, "utf8");
  // Persist match table for image-map.ts authorship.
  await writeFile(
    path.join(root, "real-images", "product-match.json"),
    `${JSON.stringify(ROWS, null, 2)}\n`,
    "utf8",
  );
  console.log(`blur entries: ${Object.keys(blur).length}, over-budget: ${over}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
