import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { of, Subject } from "rxjs";
import { InvoiceListComponent } from "./invoice-list.component";
import { InvoiceService } from "../../services/invoice.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { PagedResult } from "../../../../shared/models/api-response.model";
import { Currency } from "../../../../shared/enums/currency.enum";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

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
    total: 5000,
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
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

describe("InvoiceListComponent", () => {
  let fixture: ComponentFixture<InvoiceListComponent>;
  let component: InvoiceListComponent;
  let svc: { getInvoices: jest.Mock; downloadPdf: jest.Mock };

  beforeEach(async () => {
    svc = {
      getInvoices: jest
        .fn()
        .mockReturnValue(
          of(
            makePagedResult([
              makeInvoice(),
              makeInvoice({ id: "inv-2", invoiceNumber: "INV-0002" }),
            ]),
          ),
        ),
      downloadPdf: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InvoiceListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InvoiceService, useValue: svc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load invoices on init", () => {
    expect(svc.getInvoices).toHaveBeenCalledTimes(1);
    expect(component.result?.items.length).toBe(2);
  });

  it("onFilter resets page to 1 and reloads", () => {
    component.page = 3;
    component.onFilter();
    expect(component.page).toBe(1);
    expect(svc.getInvoices).toHaveBeenCalledTimes(2);
  });

  it("goToPage loads the requested page", () => {
    svc.getInvoices.mockReturnValue(of(makePagedResult([makeInvoice()])));
    component.goToPage(2);
    expect(component.page).toBe(2);
    expect(svc.getInvoices).toHaveBeenCalledTimes(2);
  });

  it("getInvoices is called with status filter when set", () => {
    component.statusFilter = InvoiceStatus.Paid;
    component.onFilter();
    const lastArgs = svc.getInvoices.mock.calls.at(-1)![0];
    expect(lastArgs.status).toBe(InvoiceStatus.Paid);
  });

  it("getInvoices is called with search term when set", () => {
    component.search = "INV-0001";
    component.onFilter();
    const lastArgs = svc.getInvoices.mock.calls.at(-1)![0];
    expect(lastArgs.search).toBe("INV-0001");
  });

  it("downloadPdf sets downloadingId then clears it on success", () => {
    const blobSubject = new Subject<Blob>();
    svc.downloadPdf.mockReturnValue(blobSubject.asObservable());

    // jsdom doesn't implement URL.createObjectURL — define stubs
    URL.createObjectURL = jest.fn().mockReturnValue("blob:fake");
    URL.revokeObjectURL = jest.fn();
    const anchor = {
      href: "",
      download: "",
      click: jest.fn(),
    } as unknown as HTMLAnchorElement;
    jest.spyOn(document, "createElement").mockReturnValue(anchor);

    component.downloadPdf("inv-1", "INV-0001");
    expect(component.downloadingId).toBe("inv-1");

    blobSubject.next(new Blob(["pdf"], { type: "application/pdf" }));
    blobSubject.complete();

    expect(component.downloadingId).toBeNull();
  });

  it("downloadPdf clears downloadingId on error", () => {
    const blobSubject = new Subject<Blob>();
    svc.downloadPdf.mockReturnValue(blobSubject.asObservable());

    component.downloadPdf("inv-1", "INV-0001");
    expect(component.downloadingId).toBe("inv-1");

    blobSubject.error(new Error("network error"));
    expect(component.downloadingId).toBeNull();
  });
});
