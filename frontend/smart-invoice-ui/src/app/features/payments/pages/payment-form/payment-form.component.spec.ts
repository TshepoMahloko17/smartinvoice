import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute } from "@angular/router";
import { PaymentFormComponent } from "./payment-form.component";
import { PaymentService } from "../../services/payment.service";
import { InvoiceService } from "../../../invoices/services/invoice.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { Currency } from "../../../../shared/enums/currency.enum";
import { PagedResult } from "../../../../shared/models/api-response.model";
import { Validators } from "@angular/forms";

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

function makePagedResult(items: Invoice[]): PagedResult<Invoice> {
  return {
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: 100,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

describe("PaymentFormComponent", () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let component: PaymentFormComponent;
  let paymentSvc: { record: jest.Mock };
  let invoiceSvc: { getInvoices: jest.Mock };

  const pendingInvoice = makeInvoice({
    id: "inv-1",
    status: InvoiceStatus.Pending,
    total: 1000,
    amountPaid: 0,
    balance: 1000,
  });
  const partialInvoice = makeInvoice({
    id: "inv-2",
    invoiceNumber: "INV-0002",
    status: InvoiceStatus.PartiallyPaid,
    total: 1000,
    amountPaid: 600,
    balance: 400,
  });
  const paidInvoice = makeInvoice({
    id: "inv-3",
    invoiceNumber: "INV-0003",
    status: InvoiceStatus.Paid,
    total: 1000,
    amountPaid: 1000,
    balance: 0,
  });
  const overdueInvoice = makeInvoice({
    id: "inv-4",
    invoiceNumber: "INV-0004",
    status: InvoiceStatus.Overdue,
    total: 800,
    amountPaid: 0,
    balance: 800,
  });

  function createComponent(queryParams: Record<string, string> = {}) {
    return TestBed.configureTestingModule({
      imports: [PaymentFormComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PaymentService, useValue: paymentSvc },
        { provide: InvoiceService, useValue: invoiceSvc },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (k: string) => queryParams[k] ?? null },
            },
          },
        },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(PaymentFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }

  beforeEach(() => {
    paymentSvc = { record: jest.fn() };
    invoiceSvc = {
      getInvoices: jest
        .fn()
        .mockReturnValue(
          of(
            makePagedResult([
              pendingInvoice,
              partialInvoice,
              paidInvoice,
              overdueInvoice,
            ]),
          ),
        ),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  describe("invoice loading", () => {
    beforeEach(() => createComponent());

    it("should create", () => expect(component).toBeTruthy());

    it("filters out Paid invoices from the dropdown", () => {
      expect(component.invoices.find((i) => i.id === "inv-3")).toBeUndefined();
    });

    it("includes Pending invoices in the dropdown", () => {
      expect(component.invoices.find((i) => i.id === "inv-1")).toBeDefined();
    });

    it("includes PartiallyPaid invoices in the dropdown", () => {
      expect(component.invoices.find((i) => i.id === "inv-2")).toBeDefined();
    });

    it("includes Overdue invoices in the dropdown", () => {
      expect(component.invoices.find((i) => i.id === "inv-4")).toBeDefined();
    });
  });

  describe("onInvoiceChange", () => {
    beforeEach(() => createComponent());

    it("sets selectedInvoice when an invoice is chosen", () => {
      component.onInvoiceChange("inv-2");
      expect(component.selectedInvoice).toEqual(partialInvoice);
    });

    it("sets selectedInvoice to null for unknown id", () => {
      component.onInvoiceChange("unknown");
      expect(component.selectedInvoice).toBeNull();
    });

    it("adds max validator equal to the invoice balance", () => {
      component.onInvoiceChange("inv-2"); // balance = 400
      const errors = component.form.get("amount")!.validator!({
        value: 401,
      } as any);
      expect(errors?.["max"]).toBeDefined();
    });

    it("accepts amount equal to the full outstanding balance", () => {
      component.onInvoiceChange("inv-2"); // balance = 400
      component.form.patchValue({ amount: 400 });
      expect(component.form.get("amount")!.errors).toBeNull();
    });

    it("rejects amount exceeding the outstanding balance", () => {
      component.onInvoiceChange("inv-2"); // balance = 400
      component.form.patchValue({ amount: 401 });
      expect(component.form.get("amount")!.hasError("max")).toBe(true);
    });

    it("rejects amount of 0", () => {
      component.onInvoiceChange("inv-1");
      component.form.patchValue({ amount: 0 });
      expect(component.form.get("amount")!.hasError("min")).toBe(true);
    });
  });

  describe("pre-selected invoice from query param", () => {
    beforeEach(() => createComponent({ invoiceId: "inv-2" }));

    it("pre-selects the invoice from the route query param", () => {
      expect(component.form.value.invoiceId).toBe("inv-2");
    });

    it("sets selectedInvoice from the query param", () => {
      expect(component.selectedInvoice?.id).toBe("inv-2");
    });

    it("max validator is wired to the pre-selected invoice balance", () => {
      component.form.patchValue({ amount: 401 });
      expect(component.form.get("amount")!.hasError("max")).toBe(true);
    });
  });

  describe("submit", () => {
    beforeEach(() => createComponent());

    it("does nothing when form is invalid", () => {
      component.submit();
      expect(paymentSvc.record).not.toHaveBeenCalled();
    });

    it("calls svc.record with correct args on valid submit", () => {
      paymentSvc.record.mockReturnValue(of({} as any));
      component.form.patchValue({
        invoiceId: "inv-1",
        amount: 500,
        method: "EFT",
        reference: "REF-1",
      });
      component.submit();
      expect(paymentSvc.record).toHaveBeenCalledWith(
        "inv-1",
        500,
        "EFT",
        "REF-1",
      );
    });

    it("sets saving to false on error", () => {
      paymentSvc.record.mockReturnValue(throwError(() => new Error("fail")));
      component.form.patchValue({ invoiceId: "inv-1", amount: 500 });
      component.submit();
      expect(component.saving).toBe(false);
    });
  });
});
