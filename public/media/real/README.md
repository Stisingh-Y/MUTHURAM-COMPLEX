# `public/media/real/` — real photography drop-in zone

Demo plates live under `../demo/`. When supplier/brand photos arrive:

1. Save each photo here, mirroring the demo path it replaces, e.g.
   `real/products/helmets/vortex-aero-x1-1.jpg`.
2. Match the demo aspect ratio (products 4:5, hero 16:9, promo 3:2,
   brand plates 1:1) so no layout shifts.
3. Point the catalogue row / seed data at the new `/media/real/...` URL.
4. Run `npx tsx scripts/refresh-lqip.ts` so blur placeholders cover the
   new files, then `npx tsx scripts/verify-images.ts`.

No component changes are needed — every image is referenced by URL.

Rules: only use photos you have rights to. Never commit real brand logos
or product photography that was not supplied for this catalogue.
