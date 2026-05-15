/**
 * Invoices e2e — requires the app running at http://localhost:4200
 * and the backend running at https://localhost:5001.
 *
 * Run:  npx ng serve  (frontend)
 *       dotnet run    (backend)
 * Then: npm run cy:open
 */

const EMAIL = "admin@smartinvoice.app";
const PASSWORD = "Admin@123";

/** Log in via the UI and land on the dashboard. */
function login() {
  cy.visit("/auth/login");
  cy.get('input[type="email"]').type(EMAIL);
  cy.get('input[type="password"]').type(PASSWORD);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
}

describe("Authentication", () => {
  it("redirects unauthenticated users to login", () => {
    cy.visit("/invoices");
    cy.url().should("include", "/auth/login");
  });

  it("logs in with valid credentials", () => {
    login();
    cy.contains("Dashboard").should("be.visible");
  });

  it("shows an error for invalid credentials", () => {
    cy.visit("/auth/login");
    cy.get('input[type="email"]').type("wrong@example.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/auth/login");
    // Error message rendered in the form
    cy.get("p.text-red-500").should("be.visible");
  });
});

describe("Invoices list", () => {
  beforeEach(() => {
    login();
    cy.visit("/invoices");
  });

  it("renders the invoices page heading", () => {
    cy.contains("h2", "Invoices").should("be.visible");
  });

  it("shows the New Invoice button", () => {
    cy.contains("New Invoice").should("be.visible");
  });

  it("New Invoice button navigates to the invoice form", () => {
    cy.contains("New Invoice").click();
    cy.url().should("include", "/invoices/new");
  });

  it("search input filters the list", () => {
    // Type a search term that is unlikely to match anything
    cy.get('input[placeholder="Invoice #, client…"]').type("ZZZNOMATCH");
    // Table body should show no rows (or an empty state)
    cy.get("tbody tr").should("have.length", 0);
  });

  it("status filter shows only matching invoices", () => {
    // Open the Status mat-select
    cy.contains("mat-label", "Status").parent().click();
    // Click the Paid option in the overlay panel
    cy.get("mat-option").contains("Paid").click();
    // Every status badge in the list should say Paid
    cy.get("tbody tr").each(($row) => {
      cy.wrap($row).contains("Paid").should("exist");
    });
  });
});

describe("Invoice form", () => {
  beforeEach(() => {
    login();
    cy.visit("/invoices/new");
  });

  it("renders the new invoice form", () => {
    cy.contains("New Invoice").should("be.visible");
  });

  it("shows validation errors when submitted empty", () => {
    cy.get('button[type="submit"]').click();
    // At least one mat-error should appear
    cy.get("mat-error").should("have.length.at.least", 1);
  });
});
