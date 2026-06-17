# Screenshot Automation

This script captures screenshots of the SmartInvoice frontend for README and portfolio use.

Prerequisites

- The frontend should be served locally at `http://localhost:4200` (default). If different, set `BASE_URL`.
- Node.js installed.

Install and run

```bash
cd tools/screenshots
npm install
npx playwright install
npm run capture
```

What it captures

- Desktop screenshots for: dashboard, invoices, new invoice, clients, contracts, payments
- Mobile screenshots (390x844)
- Dark mode screenshots (adds `dark` class to `<html>`)

Notes

- The script tries to log in via the UI using the seeded admin account `admin@smartinvoice.app` / `Admin@123`.
- If your app uses a different login flow, update the selectors in `screenshot.js` accordingly.
- Screenshots are written to `tools/screenshots/output/`.
