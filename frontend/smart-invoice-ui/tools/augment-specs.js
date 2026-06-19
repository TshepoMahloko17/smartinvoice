const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "..", "src", "app");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && full.endsWith(".spec.ts")) augmentSpec(full);
  }
}

function ensureImport(src, importText, afterLineMatch) {
  if (src.includes(importText)) return src;
  const lines = src.split(/\r?\n/);
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/import .* from .*;/.test(lines[i])) idx = i + 1;
  }
  lines.splice(idx, 0, importText);
  return lines.join("\n");
}

function augmentSpec(specPath) {
  let src = fs.readFileSync(specPath, "utf8");
  const specDir = path.dirname(specPath);
  // find component import
  const imp = src.match(/import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+'(.+?)';/);
  if (!imp) return;
  const compName = imp[1];
  const relPath = imp[2];
  const compPath = path.join(specDir, relPath + ".ts");
  if (!fs.existsSync(compPath)) return;
  const compSrc = fs.readFileSync(compPath, "utf8");

  // Add HttpClientTestingModule import
  src = ensureImport(
    src,
    "import { HttpClientTestingModule } from '@angular/common/http/testing';",
  );
  // Add RouterTestingModule when component depends on routing
  const needsRouter = /ActivatedRoute|Router|routerLink|RouterLink/.test(
    compSrc,
  );
  const needsActivatedRoute = /ActivatedRoute/.test(compSrc);
  if (needsRouter) {
    src = ensureImport(
      src,
      "import { RouterTestingModule } from '@angular/router/testing';",
    );
  }
  if (needsActivatedRoute) {
    src = ensureImport(
      src,
      "import { ActivatedRoute } from '@angular/router';",
    );
  }
  // Datepicker support
  const needsDatepicker =
    /MatDatepicker|mat-datepicker|MatDatepickerInput/.test(compSrc);
  if (needsDatepicker) {
    src = ensureImport(
      src,
      "import { MatNativeDateModule } from '@angular/material/core';",
    );
  }

  // If component uses MAT_DIALOG_DATA or MatDialogRef, add imports and providers
  const needsDialog = /MAT_DIALOG_DATA|MatDialogRef/.test(compSrc);
  if (needsDialog) {
    src = ensureImport(
      src,
      "import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';",
    );
  }

  // Find configureTestingModule block and insert imports/providers as needed
  const cfgMatch = src.match(
    /TestBed.configureTestingModule\((\{[\s\S]*?\})\)\s*\.compileComponents\(\)/m,
  );
  if (cfgMatch) {
    let cfg = cfgMatch[1];
    // Ensure imports array exists
    if (!/\bimports\s*:\s*\[/.test(cfg)) {
      // replace first { with { imports: [ HttpClientTestingModule, <Component> ],
      cfg = cfg.replace(
        /\{/,
        `{ imports: [ HttpClientTestingModule${needsRouter ? ", RouterTestingModule" : ""}, ${compName} ], `,
      );
    } else {
      // add HttpClientTestingModule if not present
      cfg = cfg.replace(/imports\s*:\s*\[/, (m) => {
        if (/HttpClientTestingModule/.test(cfg)) return m;
        return (
          m +
          "HttpClientTestingModule, " +
          (needsRouter ? "RouterTestingModule, " : "")
        );
      });
      // ensure component is in imports or declarations already handled
      if (!new RegExp(`${compName}`).test(cfg)) {
        cfg = cfg.replace(/imports\s*:\s*\[/, (m) => m + `${compName}, `);
      }
    }

    // Ensure RouterTestingModule is present when needed
    if (
      needsRouter &&
      /imports\s*:\s*\[/.test(cfg) &&
      !/RouterTestingModule/.test(cfg)
    ) {
      cfg = cfg.replace(/imports\s*:\s*\[/, (m) => m + "RouterTestingModule, ");
    }
    // Ensure ActivatedRoute provider present when needed
    if (
      needsActivatedRoute &&
      /\bproviders\s*:\s*\[/.test(cfg) &&
      !/ActivatedRoute/.test(cfg)
    ) {
      cfg = cfg.replace(
        /providers\s*:\s*\[/,
        (m) =>
          m +
          `{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }, `,
      );
    } else if (needsActivatedRoute && !/\bproviders\s*:\s*\[/.test(cfg)) {
      cfg = cfg.replace(
        /\}\s*$/,
        `, providers: [ { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } } ] }`,
      );
    }

    // Ensure MatNativeDateModule is present when needed
    if (
      needsDatepicker &&
      /imports\s*:\s*\[/.test(cfg) &&
      !/MatNativeDateModule/.test(cfg)
    ) {
      cfg = cfg.replace(/imports\s*:\s*\[/, (m) => m + "MatNativeDateModule, ");
    }

    // Ensure providers array for dialog if needed
    if (needsDialog) {
      if (!/\bproviders\s*:\s*\[/.test(cfg)) {
        cfg = cfg.replace(
          /\}\s*$/,
          `, providers: [ { provide: MAT_DIALOG_DATA, useValue: {} }, { provide: MatDialogRef, useValue: {} } ] }`,
        );
      } else {
        // add dialog providers if not present
        if (!/MAT_DIALOG_DATA/.test(cfg)) {
          cfg = cfg.replace(
            /providers\s*:\s*\[/,
            (m) =>
              m +
              ` { provide: MAT_DIALOG_DATA, useValue: {} }, { provide: MatDialogRef, useValue: {} }, `,
          );
        }
      }
    }

    // replace the old cfg in src with the new cfg
    src = src.replace(cfgMatch[1], cfg);
  }

  fs.writeFileSync(specPath, src, "utf8");
  console.log("Augmented", path.relative(__dirname, specPath));
}

walk(baseDir);
console.log("Done.");
