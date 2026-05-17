import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialog } from "@angular/material/dialog";
import { InvoiceDetailComponent } from "./invoice-detail.component";
import { InvoiceService } from "../../services/invoice.service";
import { PaymentService } from "../../../../features/payments/services/payment.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { Payment } from "../../../../shared/models/payment.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { Currency } from "../../../../shared/enums/currency.enum";
import { PagedResult } from "../../../../shared/models/api-response.model";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    invoiceNumber: "INV-0001",
    clientId: "client-1",
    clientName: "Acme Corp",
    clientEmail: "acme@example.com",
    issuedDate: "2026-01-01T00:00:00Z",
    dueDate: "2026-01-31T00:00:00Z",
    status: InvoiceStatus.Pending,
    total: 1000,
    amountPaid: 0,
    balance: 1000,
    currency: Currency.ZAR,
    items: [],
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    invoiceId: "inv-1",
    invoiceNumber: "INV-0001",
    amount: 400,
    paidOn: "2026-05-17T10:00:00Z",
    createdAt: "2026-05-17T10:00:00Z",
    ...overrides,
  };
}

function makePagedPayments(items: Payment[]): PagedResult<Payment> {
  return {
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: 50,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

describe("InvoiceDetailComponent — partial payment", () => {
  let fixture: ComponentFixture<InvoiceDetailComponent>;
  let component: InvoiceDetailComponent;
  let invoiceSvc: {
    getById: jest.Mock;
    updateStatus: jest.Mock;
    delete: jest.Mock;
    downloadPdf: jest.Mock;
  };
  let paymentSvc: { getByInvoice: jest.Mock; delete: jest.Mock };
  let dialog: { open: jest.Mock };

  async function setup(invoice: Invoice, payments: Payment[] = []) {
    invoiceSvc = {
      getById: jest.fn().mockReturnValue(of(invoice)),
      updateStatus: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
      downloadPdf: jest.fn(),
    };
    paymentSvc = {
      getByInvoice: jest.fn().mockReturnValue(of(makePagedPayments(payments))),
      delete: jest.fn().mockReturnValue(of({})),
    };
    dialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InvoiceService, useValue: invoiceSvc },
        { provide: PaymentService, useValue: paymentSvc },
        { provide: MatDialog, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: () => "inv-1" }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => jest.restoreAllMocks());

  describe("status badge", () => {
    it("reflects PartiallyPaid status from the invoice", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 400,
        balance: 600,
      });
      await setup(inv, [makePayment({ amount: 400 })]);
      expect(component.invoice?.status).toBe(InvoiceStatus.PartiallyPaid);
    });

    it("reflects Paid status when invoice is fully paid", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.Paid,
        amountPaid: 1000,
        balance: 0,
      });
      await setup(inv, [makePayment({ amount: 1000 })]);
      expect(component.invoice?.status).toBe(InvoiceStatus.Paid);
    });
  });

  describe("totalPaid getter", () => {
    it("returns 0 when no payments", async () => {
      await setup(makeInvoice());
      expect(component.totalPaid).toBe(0);
    });

    it("sums all payment amounts", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 700,
        balance: 300,
      });
      const payments = [
        makePayment({ amount: 400 }),
        makePayment({ id: "pay-2", amount: 300 }),
      ];
      await setup(inv, payments);
      expect(component.totalPaid).toBe(700);
    });
  });

  describe("balance display", () => {
    it("invoice.balance is positive for a partially paid invoice", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 400,
        balance: 600,
      });
      await setup(inv, [makePayment({ amount: 400 })]);
      expect(component.invoice?.balance).toBe(600);
    });

    it("invoice.balance is 0 for a fully paid invoice", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.Paid,
        amountPaid: 1000,
        balance: 0,
      });
      await setup(inv, [makePayment({ amount: 1000 })]);
      expect(component.invoice?.balance).toBe(0);
    });
  });

  describe("deletePayment — status rollback", () => {
    it("reloads invoice after deleting a payment", async () => {
      const partialInvoice = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 400,
        balance: 600,
      });
      const pendingInvoice = makeInvoice({
        status: InvoiceStatus.Pending,
        amountPaid: 0,
        balance: 1000,
      });
      const payment = makePayment({ amount: 400 });

      await setup(partialInvoice, [payment]);

      // After deletion the server returns the updated invoice (status rolled back to Pending)
      invoiceSvc.getById.mockReturnValue(of(pendingInvoice));
      const dialogRef = { afterClosed: jest.fn().mockReturnValue(of(true)) };
      dialog.open.mockReturnValue(dialogRef);

      component.deletePayment(payment);

      expect(paymentSvc.delete).toHaveBeenCalledWith("pay-1");
      expect(invoiceSvc.getById).toHaveBeenCalledTimes(2); // once on init, once after delete
      expect(component.invoice?.status).toBe(InvoiceStatus.Pending);
    });

    it("removes the payment from the local list after deletion", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 400,
        balance: 600,
      });
      const payment = makePayment({ amount: 400 });
      await setup(inv, [payment]);

      invoiceSvc.getById.mockReturnValue(of(makeInvoice()));
      const dialogRef = { afterClosed: jest.fn().mockReturnValue(of(true)) };
      dialog.open.mockReturnValue(dialogRef);

      component.deletePayment(payment);

      expect(component.payments.find((p) => p.id === "pay-1")).toBeUndefined();
    });

    it("does not delete when dialog is cancelled", async () => {
      const inv = makeInvoice({
        status: InvoiceStatus.PartiallyPaid,
        amountPaid: 400,
        balance: 600,
      });
      const payment = makePayment({ amount: 400 });
      await setup(inv, [payment]);

      const dialogRef = { afterClosed: jest.fn().mockReturnValue(of(false)) };
      dialog.open.mockReturnValue(dialogRef);

      component.deletePayment(payment);

      expect(paymentSvc.delete).not.toHaveBeenCalled();
    });
  });
});
