import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(root, "public", "logo.png");

const circleSvg = (size) => `
  <svg width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
  </svg>
`;

async function generateCircularIcon(size, outputPath) {
  const mask = Buffer.from(circleSvg(size));
  const image = await sharp(logoPath)
    .resize(size, size)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  writeFileSync(outputPath, image);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  await generateCircularIcon(32, join(root, "app", "icon.png"));
  await generateCircularIcon(180, join(root, "app", "apple-icon.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
