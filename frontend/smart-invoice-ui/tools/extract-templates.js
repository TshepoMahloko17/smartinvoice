const fs = require("fs");
const path = require("path");

const appDir = path.join(
  process.cwd(),
  "frontend",
  "smart-invoice-ui",
  "src",
  "app",
);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && full.endsWith(".component.ts")) processFile(full);
  }
}

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  const templateRegex = /template:\s*`([\s\S]*?)`/m;
  const m = src.match(templateRegex);
  if (!m) return;
  const html = m[1];

  const dir = path.dirname(file);
  const base = path.basename(file, ".ts"); // e.g., my.component
  const htmlFile = path.join(dir, base + ".html");

  // Write HTML file (if not exists or overwrite)
  fs.writeFileSync(htmlFile, html.trimStart(), "utf8");
  console.log("Wrote", path.relative(process.cwd(), htmlFile));

  // Replace template with templateUrl
  const relHtml = "./" + path.basename(htmlFile);
  src = src.replace(templateRegex, `templateUrl: '${relHtml}'`);
  fs.writeFileSync(file, src, "utf8");
  console.log("Updated", path.relative(process.cwd(), file));

  // Ensure spec file exists
  const specFile = path.join(dir, base + ".spec.ts");
  if (!fs.existsSync(specFile)) {
    const classMatch = src.match(/export\s+class\s+([A-Za-z0-9_]+)/);
    const className = classMatch ? classMatch[1] : "UnknownComponent";
    const importPath = "./" + path.basename(file, ".ts");
    const spec = `import { ComponentFixture, TestBed } from '@angular/core/testing';\nimport { ${className} } from '${importPath}';\n\ndescribe('${className}', () => {\n  let component: ${className};\n  let fixture: ComponentFixture<${className}>;\n\n  beforeEach(async () => {\n    await TestBed.configureTestingModule({\n      declarations: [ ${className} ]\n    }).compileComponents();\n\n    fixture = TestBed.createComponent(${className});\n    component = fixture.componentInstance;\n    fixture.detectChanges();\n  });\n\n  it('should create', () => {\n    expect(component).toBeTruthy();\n  });\n});\n`;
    fs.writeFileSync(specFile, spec, "utf8");
    console.log("Created", path.relative(process.cwd(), specFile));
  }
}

walk(appDir);
console.log("Done.");
