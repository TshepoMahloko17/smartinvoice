const fs = require("fs");
const path = require("path");

// Use script directory as base to avoid cwd issues
const srcDir = path.join(__dirname, "..", "src", "app");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && full.endsWith(".spec.ts")) processSpec(full);
  }
}

function processSpec(specPath) {
  let src = fs.readFileSync(specPath, "utf8");
  // find import like: import { XxxComponent } from './xxx.component';
  const imp = src.match(/import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+'(.+?)';/);
  if (!imp) return;
  const compName = imp[1];
  const relPath = imp[2];
  const compPath = path.join(path.dirname(specPath), relPath + ".ts");
  if (!fs.existsSync(compPath)) return;
  const compSrc = fs.readFileSync(compPath, "utf8");
  if (!/standalone\s*:\s*true/.test(compSrc)) return;

  // Replace `declarations: [ Xxx ]` with `imports: [ Xxx ]`
  const newSrc = src.replace(
    /declarations\s*:\s*\[([^\]]*)\]/m,
    "imports: [$1]",
  );
  if (newSrc !== src) {
    fs.writeFileSync(specPath, newSrc, "utf8");
    console.log("Updated", path.relative(process.cwd(), specPath));
  }
}

walk(srcDir);
console.log("Done.");
