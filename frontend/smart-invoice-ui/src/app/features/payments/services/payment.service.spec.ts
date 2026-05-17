import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { PaymentService } from "./payment.service";
import { Payment } from "../../../shared/models/payment.model";
import { PagedResult } from "../../../shared/models/api-response.model";
import { environment } from "../../../../environments/environment";

const base = `${environment.apiUrl}/payments`;

const mockPayment: Payment = {
  id: "pay-1",
  invoiceId: "inv-1",
  invoiceNumber: "INV-0001",
  amount: 400,
  paidOn: "2026-05-17T10:00:00Z",
  method: "EFT",
  reference: "REF-001",
  createdAt: "2026-05-17T10:00:00Z",
};

const mockPaged: PagedResult<Payment> = {
  items: [mockPayment],
  totalCount: 1,
  pageNumber: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe("PaymentService", () => {
  let svc: PaymentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    svc = TestBed.inject(PaymentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe("getPayments", () => {
    it("GETs the base URL with default pagination params", () => {
      svc.getPayments().subscribe();
      const req = http.expectOne((r) => r.url === base);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("page")).toBe("1");
      expect(req.request.params.get("pageSize")).toBe("20");
      req.flush(mockPaged);
    });
  });

  describe("getByInvoice", () => {
    it("GETs payments filtered by invoiceId", () => {
      svc.getByInvoice("inv-1").subscribe();
      const req = http.expectOne((r) => r.url === base);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("invoiceId")).toBe("inv-1");
      req.flush(mockPaged);
    });
  });

  describe("record", () => {
    it("POSTs a new payment with required fields", () => {
      svc.record("inv-1", 400, "EFT", "REF-001").subscribe();
      const req = http.expectOne(base);
      expect(req.request.method).toBe("POST");
      expect(req.request.body.invoiceId).toBe("inv-1");
      expect(req.request.body.amount).toBe(400);
      expect(req.request.body.method).toBe("EFT");
      expect(req.request.body.reference).toBe("REF-001");
      expect(req.request.body.paidOn).toBeDefined();
      req.flush(mockPayment);
    });

    it("POSTs a payment without optional fields", () => {
      svc.record("inv-1", 200).subscribe();
      const req = http.expectOne(base);
      expect(req.request.body.method).toBeUndefined();
      expect(req.request.body.reference).toBeUndefined();
      req.flush(mockPayment);
    });

    it("returns the created payment DTO", () => {
      let result: Payment | undefined;
      svc.record("inv-1", 400, "EFT").subscribe((p) => (result = p));
      http.expectOne(base).flush(mockPayment);
      expect(result).toEqual(mockPayment);
    });
  });

  describe("delete", () => {
    it("sends DELETE to the correct URL", () => {
      svc.delete("pay-1").subscribe();
      const req = http.expectOne(`${base}/pay-1`);
      expect(req.request.method).toBe("DELETE");
      req.flush(null);
    });
  });
});
