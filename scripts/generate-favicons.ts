#!/usr/bin/env bun
/**
 * Favicon Generation Script
 *
 * Converts the SVG favicon to optimized PNG files at standard dimensions.
 * This improves page load performance by:
 * - Reducing render-blocking SVG parsing
 * - Providing pre-sized images for different contexts
 * - Enabling browser caching of bitmap favicons
 *
 * Standard favicon sizes:
 * - 16x16: Browser tab icon
 * - 32x32: Browser tab icon (high DPI)
 * - 48x48: Windows site icon
 * - 96x96: Google TV
 * - 128x128: Chrome Web Store
 * - 180x180: Apple Touch Icon
 * - 192x192: Android Chrome
 * - 512x512: PWA splash screen
 *
 * Usage: bun run scripts/generate-favicons.ts
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const INPUT_SVG = join(ROOT, "public", "favicon.svg");
const OUTPUT_DIR = join(ROOT, "public", "favicons");

// Standard favicon dimensions
const SIZES = [16, 32, 48, 96, 128, 180, 192, 512] as const;

// Apple touch icon size
const APPLE_TOUCH_ICON_SIZE = 180;

async function generateFavicons() {
  console.log("Generating favicons from SVG...\n");

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read the SVG file
  const svgBuffer = readFileSync(INPUT_SVG);

  // Generate PNG for each size
  for (const size of SIZES) {
    const outputPath = join(OUTPUT_DIR, `favicon-${size}x${size}.png`);

    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({
          compressionLevel: 9,
          palette: true,
        })
        .toFile(outputPath);

      console.log(`  Generated ${size}x${size}`);
    } catch (error) {
      console.error(`  Failed to generate ${size}x${size}:`, error);
    }
  }

  // Generate Apple Touch Icon with special naming
  const appleTouchPath = join(OUTPUT_DIR, "apple-touch-icon.png");
  try {
    await sharp(svgBuffer)
      .resize(APPLE_TOUCH_ICON_SIZE, APPLE_TOUCH_ICON_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        compressionLevel: 9,
      })
      .toFile(appleTouchPath);

    console.log(`  Generated apple-touch-icon.png`);
  } catch (error) {
    console.error(`  Failed to generate apple-touch-icon:`, error);
  }

  // Generate favicon.ico (multi-size ICO file) - contains 16, 32, 48
  // Note: sharp doesn't support ICO directly, so we'll use the 32x32 PNG
  // Most browsers prefer PNG anyway
  const favicon32Path = join(OUTPUT_DIR, "favicon-32x32.png");
  const faviconIcoPath = join(ROOT, "public", "favicon.ico");

  // Copy 32x32 as favicon.ico fallback (browsers handle PNG in .ico)
  if (existsSync(favicon32Path)) {
    const png32 = readFileSync(favicon32Path);
    writeFileSync(faviconIcoPath, png32);
    console.log(`  Created favicon.ico (32x32 PNG)`);
  }

  // Generate web manifest icons section
  const manifestIcons = SIZES.filter((s) => s >= 192).map((size) => ({
    src: `/favicons/favicon-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any maskable",
  }));

  console.log("\nAdd these to your HTML <head>:\n");
  console.log(`<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`);

  console.log("\nWeb manifest icons array:\n");
  console.log(JSON.stringify(manifestIcons, null, 2));

  console.log("\nFavicon generation complete!");
}

generateFavicons().catch(console.error);
