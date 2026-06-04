const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const base = process.env.BASE_URL || "http://localhost:4200";
  const out = "tools/screenshots/output";
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Login via UI to obtain session tokens
  try {
    await page.goto(`${base}/auth/login`, { waitUntil: "networkidle" });
    // best-effort selectors for login form
    await page
      .fill("input[type=email], input[name=email]", "admin@smartinvoice.app")
      .catch(() => {});
    await page
      .fill("input[type=password], input[name=password]", "Admin@123")
      .catch(() => {});
    await Promise.all([
      page
        .click(
          'button[type=submit], button:has-text("Sign in"), button:has-text("Login")',
        )
        .catch(() => {}),
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 5000 })
        .catch(() => {}),
    ]);
  } catch (e) {
    console.warn("Login attempt failed or not needed:", e.message);
  }

  const routes = [
    { name: "dashboard", path: "/dashboard" },
    { name: "invoices", path: "/invoices" },
    { name: "invoice_new", path: "/invoices/new" },
    { name: "clients", path: "/clients" },
    { name: "contracts", path: "/contracts" },
    { name: "payments", path: "/payments" },
  ];

  // Desktop screenshots
  for (const r of routes) {
    const url = `${base}${r.path}`;
    await page.goto(url).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    const file = `${out}/${r.name}-desktop.png`;
    await page
      .screenshot({ path: file, fullPage: true })
      .catch((e) => console.warn("screenshot failed", e.message));
    console.log("Saved", file);
  }

  // Desktop-only capture (light mode)
  // Mobile and dark-mode captures intentionally skipped per user request.

  await browser.close();
  console.log("Done. Screenshots are in", out);
})();
