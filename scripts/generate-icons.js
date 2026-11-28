#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Node asset generation script. */
/**
 * Rasterizes assets/brand/icon-source.svg into every PNG asset app.config.ts
 * references. Run after any change to the source SVG:
 *   npm run generate:icons
 * Requires the optional `sharp` dependency (this
 * script is intentionally the only thing that needs it, so it's not a
 * runtime dependency of the app).
 */
const path = require("path");
const fs = require("fs");

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const SOURCE_SVG = path.join(ASSETS_DIR, "brand", "icon-source.svg");

const TARGETS = [
  { file: "icon.png", size: 1024 },
  { file: "adaptive-icon-foreground.png", size: 1024, source: "adaptive-source.svg" },
  { file: "splash.png", size: 1284, source: "splash-source.svg" },
  { file: "favicon.png", size: 196, source: "favicon-source.svg" },
];

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error(
      "Optional image tool `sharp` is unavailable. Install it with `npm install --no-save sharp@0.34.5` on your design machine, then re-run `npm run generate:icons`."
    );
    process.exit(1);
  }



  for (const target of TARGETS) {
    const outPath = path.join(ASSETS_DIR, target.file);
    const svg = fs.readFileSync(target.source ? path.join(ASSETS_DIR, "brand", target.source) : SOURCE_SVG);
    const rendered = sharp(svg, { density: 384 })
      .resize(target.size, target.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
    // App Store icons must be opaque; foreground and splash retain transparency.
    if (target.file === "icon.png") rendered.removeAlpha();
    await rendered.png().toFile(outPath);
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${target.size}x${target.size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
