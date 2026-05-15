import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ClientService } from "./client.service";
import {
  Client,
  CreateClientRequest,
} from "../../../shared/models/client.model";
import { PagedResult } from "../../../shared/models/api-response.model";
import { environment } from "../../../../environments/environment";

const base = `${environment.apiUrl}/clients`;

const mockClient: Client = {
  id: "client-1",
  name: "Acme Corp",
  email: "acme@example.com",
  totalInvoices: 3,
  totalRevenue: 15000,
  createdAt: "2026-01-01T00:00:00Z",
};

const mockPagedResult: PagedResult<Client> = {
  items: [mockClient],
  totalCount: 1,
  pageNumber: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe("ClientService", () => {
  let svc: ClientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    svc = TestBed.inject(ClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe("getClients", () => {
    it("GETs the base URL with default params", () => {
      svc.getClients().subscribe();
      const req = http.expectOne((r) => r.url === base);
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("page")).toBe("1");
      expect(req.request.params.get("pageSize")).toBe("20");
      req.flush(mockPagedResult);
    });

    it("includes search param when provided", () => {
      svc.getClients(1, 20, "Acme").subscribe();
      const req = http.expectOne((r) => r.url === base);
      expect(req.request.params.get("search")).toBe("Acme");
      req.flush(mockPagedResult);
    });

    it("does not include search param when empty", () => {
      svc.getClients(1, 20, "").subscribe();
      const req = http.expectOne((r) => r.url === base);
      expect(req.request.params.has("search")).toBe(false);
      req.flush(mockPagedResult);
    });
  });

  describe("getById", () => {
    it("GETs /clients/:id", () => {
      svc.getById("client-1").subscribe();
      const req = http.expectOne(`${base}/client-1`);
      expect(req.request.method).toBe("GET");
      req.flush(mockClient);
    });
  });

  describe("create", () => {
    it("POSTs to base URL with request body", () => {
      const payload: CreateClientRequest = {
        name: "Acme Corp",
        email: "acme@example.com",
      };
      svc.create(payload).subscribe();
      const req = http.expectOne(base);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(payload);
      req.flush(mockClient);
    });
  });

  describe("update", () => {
    it("PUTs to /clients/:id with partial body", () => {
      svc.update("client-1", { name: "Acme Updated" }).subscribe();
      const req = http.expectOne(`${base}/client-1`);
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual({ name: "Acme Updated" });
      req.flush(null);
    });
  });

  describe("delete", () => {
    it("DELETEs /clients/:id", () => {
      svc.delete("client-1").subscribe();
      const req = http.expectOne(`${base}/client-1`);
      expect(req.request.method).toBe("DELETE");
      req.flush(null);
    });
  });
});
