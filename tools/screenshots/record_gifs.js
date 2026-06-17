const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const base = process.env.BASE_URL || "http://localhost:4200";
const outDir = path.resolve(__dirname, "videos");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function saveVideo(page, name) {
  try {
    const videoPath = await page.video().path();
    const dest = path.join(outDir, name);
    fs.renameSync(videoPath, dest);
    console.log("Saved video:", dest);
    return dest;
  } catch (err) {
    console.error("Failed to save video", err);
    return null;
  }
}

async function tryFill(page, selectors, value) {
  for (const s of selectors) {
    try {
      if (await page.$(s)) {
        await page.fill(s, value);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function tryClick(page, selectors) {
  for (const s of selectors) {
    try {
      if (await page.$(s)) {
        await page.click(s);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function record(name, actions, opts = {}) {
  const browser = await chromium.launch();
  const contextOpts = {
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  };
  if (opts.storageState) contextOpts.storageState = opts.storageState;
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  try {
    await actions(page);
  } catch (err) {
    console.error("Action error for", name, err);
  }
  await page.waitForTimeout(800);
  await context.close();
  await browser.close();
  return await saveVideo(page, name + ".webm");
}

(async () => {
  console.log("Recording GIF source videos to", outDir);

  // Save authenticated storage state after login
  const authFile = path.join(__dirname, "auth.json");
  const browser = await chromium.launch();
  const loginContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const loginPage = await loginContext.newPage();
  await loginPage.goto(base + "/auth/login");
  await loginPage.waitForTimeout(500);
  await tryFill(
    loginPage,
    [
      'input[formcontrolname="email"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="Email"]',
    ],
    "admin@smartinvoice.app",
  );
  await tryFill(
    loginPage,
    [
      'input[formcontrolname="password"]',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Password"]',
    ],
    "Admin@123",
  );
  await tryClick(loginPage, [
    'button[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
  ]);
  await loginPage.waitForTimeout(1500);
  await loginContext.storageState({ path: authFile });
  await loginContext.close();
  await browser.close();

  // 1) Login demo (authenticated view)
  await record(
    "login",
    async (page) => {
      await page.goto(base + "/auth/login");
      await page.waitForTimeout(700);
    },
    { storageState: authFile },
  );

  // 2) Create invoice demo (authenticated)
  await record(
    "create-invoice",
    async (page) => {
      await page.goto(base + "/invoices/new");
      await page.waitForTimeout(500);
      await tryFill(
        page,
        [
          'input[formcontrolname="clientName"]',
          'input[name="clientName"]',
          'input[placeholder*="Client"]',
        ],
        "Demo Client",
      );
      await tryFill(
        page,
        [
          'input[formcontrolname="date"]',
          'input[name="date"]',
          'input[type="date"]',
        ],
        new Date().toISOString().slice(0, 10),
      );
      await tryClick(page, [
        'button:has-text("Save")',
        'button:has-text("Create")',
      ]);
      await page.waitForTimeout(1200);
    },
    { storageState: authFile },
  );

  // 3) Download PDF demo (authenticated)
  await record(
    "download-pdf",
    async (page) => {
      await page.goto(base + "/invoices");
      await page.waitForTimeout(700);
      await tryClick(page, [
        'button[aria-label*="download"]',
        'button:has-text("PDF")',
        'a:has-text("Download")',
      ]);
      await page.waitForTimeout(1200);
    },
    { storageState: authFile },
  );

  // 4) Dashboard demo (authenticated)
  await record(
    "dashboard",
    async (page) => {
      await page.goto(base + "/dashboard");
      await page.waitForTimeout(500);
      try {
        await page.hover("css=.card, .widget");
      } catch (e) {}
      await page.waitForTimeout(1000);
    },
    { storageState: authFile },
  );

  console.log("Recording finished. Videos saved under", outDir);
})();
