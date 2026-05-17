/**
 * Partial Payment e2e — requires the app running at http://localhost:4200
 * and the backend running at https://localhost:5001 with seeded data.
 *
 * Run:  npx ng serve  (frontend)
 *       dotnet run    (backend)
 * Then: npm run cy:open
 *
 * These tests cover the full partial payment lifecycle:
 *  1. Recording a partial payment → invoice shows "Partially Paid"
 *  2. Balance Due row appears in the payment history section
 *  3. Recording the remaining amount → invoice becomes "Paid"
 *  4. Deleting a payment rolls the invoice back to "Partially Paid"
 *  5. Overpayment is blocked on the payment form
 *  6. "Partially Paid" filter on the invoice list works
 */

const EMAIL = "admin@smartinvoice.app";
const PASSWORD = "Admin@123";

function login() {
  cy.visit("/auth/login");
  cy.get('input[type="email"]').type(EMAIL);
  cy.get('input[type="password"]').type(PASSWORD);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
}

/** Creates a new invoice via the UI and returns its detail URL. */
function createInvoice(): string {
  cy.visit("/invoices/new");
  // Client
  cy.contains("mat-label", "Client").parent().click();
  cy.get("mat-option").first().click();
  // Dates — use today & 30 days from now (native date inputs)
  const today = new Date().toISOString().split("T")[0];
  const due = new Date(Date.now() + 30 * 86400_000).toISOString().split("T")[0];
  cy.get('input[formControlName="issuedDate"]').type(today);
  cy.get('input[formControlName="dueDate"]').type(due);
  // Add one line item
  cy.contains("button", "Add Item").click();
  cy.get('input[placeholder="Description"]').first().type("Consulting");
  cy.get('input[placeholder="Qty"]').first().clear().type("2");
  cy.get('input[placeholder="Unit Price"]').first().clear().type("500");
  cy.get('button[type="submit"]').click();
  // Land on the invoice detail page
  cy.url().should("match", /\/invoices\/[a-z0-9-]+$/);
  return cy.url() as unknown as string;
}

/** Records a payment from the invoice detail page. */
function recordPaymentFromDetail(amount: number, method = "EFT") {
  cy.contains("a", "Record Payment").click();
  cy.url().should("include", "/payments/new");
  cy.contains("mat-label", "Amount")
    .parent()
    .find("input")
    .clear()
    .type(String(amount));
  cy.contains("mat-label", "Payment Method").parent().click();
  cy.get("mat-option").contains(method).click();
  cy.contains("button", "Record Payment").click();
}

describe("Partial Payment — invoice status transitions", () => {
  let invoiceUrl: string;

  before(() => {
    login();
    // Create a fresh R1000 invoice to test against
    cy.visit("/invoices/new");
    cy.contains("mat-label", "Client").parent().click();
    cy.get("mat-option").first().click();
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 30 * 86400_000)
      .toISOString()
      .split("T")[0];
    cy.get('input[formControlName="issuedDate"]').type(today);
    cy.get('input[formControlName="dueDate"]').type(due);
    cy.contains("button", "Add Item").click();
    cy.get('input[placeholder="Description"]').first().type("Consulting");
    cy.get('input[placeholder="Qty"]').first().clear().type("2");
    cy.get('input[placeholder="Unit Price"]').first().clear().type("500");
    cy.get('button[type="submit"]').click();
    cy.url()
      .should("match", /\/invoices\/[a-z0-9-]+$/)
      .then((url) => {
        invoiceUrl = url;
      });
  });

  beforeEach(() => {
    login();
  });

  it("invoice starts with Pending status", () => {
    cy.visit(invoiceUrl);
    cy.get(".status-pill").should("contain.text", "Pending");
  });

  it("recording a partial payment shows Partially Paid badge", () => {
    cy.visit(invoiceUrl);
    recordPaymentFromDetail(400);
    cy.get(".status-pill").should("contain.text", "Partially Paid");
  });

  it("Balance Due row appears after a partial payment", () => {
    cy.visit(invoiceUrl);
    cy.contains("Balance Due").should("be.visible");
  });

  it("payment history shows the recorded partial amount", () => {
    cy.visit(invoiceUrl);
    cy.contains("R400").should("be.visible");
  });

  it("recording the remaining amount marks invoice as Paid", () => {
    cy.visit(invoiceUrl);
    recordPaymentFromDetail(600);
    cy.get(".status-pill").should("contain.text", "Paid");
  });

  it("Balance Due row disappears once fully paid", () => {
    cy.visit(invoiceUrl);
    cy.contains("Balance Due").should("not.exist");
  });
});

describe("Partial Payment — overpayment guard", () => {
  beforeEach(() => login());

  it("payment form shows outstanding balance for a partially paid invoice", () => {
    cy.visit("/payments/new");
    cy.contains("mat-label", "Invoice").parent().click();
    // Pick any PartiallyPaid invoice from the dropdown
    cy.get("mat-option").contains("INV-").first().click();
    // Outstanding balance info line should appear
    cy.contains("Outstanding:").should("be.visible");
  });

  it("amount field rejects value above outstanding balance", () => {
    cy.visit("/payments/new");
    cy.contains("mat-label", "Invoice").parent().click();
    cy.get("mat-option").first().click();
    // Enter an absurdly large amount
    cy.contains("mat-label", "Amount")
      .parent()
      .find("input")
      .clear()
      .type("9999999");
    cy.contains("button", "Record Payment").click();
    cy.get("mat-error").should("be.visible");
  });
});

describe("Partial Payment — delete rollback", () => {
  beforeEach(() => login());

  it("deleting a payment rolls invoice status back", () => {
    // Navigate to a partially paid invoice and delete its only payment
    cy.visit("/invoices");
    cy.contains("mat-label", "Status").parent().click();
    cy.get("mat-option").contains("Partially Paid").click();
    cy.get("tbody tr").first().click();
    cy.url().should("match", /\/invoices\/[a-z0-9-]+$/);

    // Delete the first payment
    cy.get('[aria-label="Delete payment"]').first().click();
    cy.contains("button", "Confirm").click();

    // Status should no longer be Partially Paid (either Pending or Paid depending on remaining)
    cy.get(".status-pill").should("not.contain.text", "Partially Paid");
  });
});

describe("Partial Payment — invoice list filter", () => {
  beforeEach(() => {
    login();
    cy.visit("/invoices");
  });

  it("Partially Paid option exists in the status filter", () => {
    cy.contains("mat-label", "Status").parent().click();
    cy.get("mat-option").contains("Partially Paid").should("exist");
  });

  it("filtering by Partially Paid shows only matching invoices", () => {
    cy.contains("mat-label", "Status").parent().click();
    cy.get("mat-option").contains("Partially Paid").click();
    cy.get("tbody tr").each(($row) => {
      cy.wrap($row).contains("Partially Paid").should("exist");
    });
  });
});
