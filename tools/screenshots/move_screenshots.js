const fs = require("fs");
const path = require("path");

const repo = path.resolve(__dirname, "..");
const dst = path.join(__dirname, "output");
if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

const candidates = [
  path.join(__dirname, "tools", "screenshots", "output"),
  path.join(
    __dirname,
    "tools",
    "screenshots",
    "tools",
    "screenshots",
    "output",
  ),
  path.join(
    __dirname,
    "tools",
    "screenshots",
    "tools",
    "screenshots",
    "tools",
    "screenshots",
    "output",
  ),
];

let moved = [];
for (const src of candidates) {
  if (fs.existsSync(src)) {
    const files = fs.readdirSync(src).filter((f) => f.endsWith(".png"));
    for (const f of files) {
      const s = path.join(src, f);
      const d = path.join(dst, f);
      fs.copyFileSync(s, d);
      moved.push(d);
    }
  }
}

if (moved.length === 0) {
  console.error("No screenshots found in candidates:", candidates);
  process.exit(1);
}

console.log("Moved files:", moved);
process.exit(0);
