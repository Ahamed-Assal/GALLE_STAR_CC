import sharp from "sharp";

const input = process.argv[2] ?? "public/logo.jpg";

const { data, info } = await sharp(input)
  .resize(120, 120, { fit: "inside" })
  .raw()
  .toBuffer({ resolveWithObject: true });

const bins = new Map();
const quantize = (v) => Math.min(255, Math.floor(v / 16) * 16);

for (let i = 0; i < data.length; i += info.channels) {
  const r = quantize(data[i]);
  const g = quantize(data[i + 1]);
  const b = quantize(data[i + 2]);
  const avg = (r + g + b) / 3;

  if (avg > 225 || avg < 25) {
    continue;
  }

  const key = `${r},${g},${b}`;
  bins.set(key, (bins.get(key) ?? 0) + 1);
}

const [dominant] = [...bins.entries()].sort((a, b) => b[1] - a[1]);
if (!dominant) {
  console.log("No dominant color found.");
  process.exit(0);
}

const [r, g, b] = dominant[0].split(",").map(Number);
const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

console.log(`Dominant color: ${hex} (rgb ${r}, ${g}, ${b})`);
