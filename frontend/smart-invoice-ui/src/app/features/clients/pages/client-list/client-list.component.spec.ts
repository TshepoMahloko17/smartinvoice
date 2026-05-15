import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ClientListComponent } from "./client-list.component";
import { ClientService } from "../../services/client.service";
import { Client } from "../../../../shared/models/client.model";
import { PagedResult } from "../../../../shared/models/api-response.model";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    name: "Acme Corp",
    email: "acme@example.com",
    totalInvoices: 3,
    totalRevenue: 15000,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makePagedResult(items: Client[]): PagedResult<Client> {
  return {
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

describe("ClientListComponent", () => {
  let fixture: ComponentFixture<ClientListComponent>;
  let component: ClientListComponent;
  let svc: { getClients: jest.Mock };

  beforeEach(async () => {
    svc = {
      getClients: jest
        .fn()
        .mockReturnValue(
          of(
            makePagedResult([
              makeClient(),
              makeClient({
                id: "client-2",
                name: "Beta Ltd",
                email: "beta@example.com",
              }),
            ]),
          ),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [ClientListComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: ClientService, useValue: svc }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("loads clients on init", () => {
    expect(svc.getClients).toHaveBeenCalledTimes(1);
    expect(svc.getClients).toHaveBeenCalledWith(1, 20, "");
    expect(component.result?.items.length).toBe(2);
  });

  it("load() is called again when search changes", () => {
    component.search = "Acme";
    component.load();
    expect(svc.getClients).toHaveBeenCalledTimes(2);
    expect(svc.getClients).toHaveBeenCalledWith(1, 20, "Acme");
  });

  it("result is null initially before ngOnInit resolves", () => {
    // Create a fresh component without detectChanges to inspect pre-init state
    const freshFixture = TestBed.createComponent(ClientListComponent);
    expect(freshFixture.componentInstance.result).toBeNull();
  });
});
