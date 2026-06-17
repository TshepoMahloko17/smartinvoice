const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const videosDir = path.resolve(__dirname, "videos");
const outDir = path.resolve(__dirname, "gifs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function ffmpegAvailable() {
  try {
    const r = spawnSync("ffmpeg", ["-version"]);
    return r.status === 0 || r.status === null;
  } catch (e) {
    return false;
  }
}

if (!ffmpegAvailable()) {
  console.error(
    "ffmpeg not found on PATH. Install ffmpeg to convert videos to GIFs.",
  );
  process.exit(2);
}

const files = fs.existsSync(videosDir)
  ? fs
      .readdirSync(videosDir)
      .filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"))
  : [];
if (files.length === 0) {
  console.error("No video files found in", videosDir);
  process.exit(1);
}

for (const f of files) {
  const inPath = path.join(videosDir, f);
  const base = path.parse(f).name;
  const outPath = path.join(outDir, base + ".gif");
  console.log("Converting", inPath, "->", outPath);
  // ffmpeg conversion command tuned for small gifs
  const args = [
    "-y",
    "-i",
    inPath,
    "-vf",
    "fps=15,scale=640:-1:flags=lanczos",
    "-loop",
    "0",
    outPath,
  ];
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) console.error("ffmpeg failed for", f);
}

console.log("Conversion complete. GIFs are in", outDir);
