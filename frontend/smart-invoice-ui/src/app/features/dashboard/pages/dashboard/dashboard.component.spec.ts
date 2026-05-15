import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { DashboardComponent } from "./dashboard.component";
import { DashboardService } from "../../services/dashboard.service";
import { InvoiceService } from "../../../invoices/services/invoice.service";
import {
  DashboardStats,
  RevenueChart,
} from "../../../../shared/models/dashboard-stats.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { Invoice } from "../../../../shared/models/invoice.model";
import { PagedResult } from "../../../../shared/models/api-response.model";
import { Currency } from "../../../../shared/enums/currency.enum";

const mockStats: DashboardStats = {
  totalRevenue: 120000,
  revenueChangePercent: 5.2,
  pendingInvoicesCount: 4,
  pendingInvoicesTotal: 8000,
  pendingChangePercent: -1.5,
  activeClientsCount: 12,
  newClientsThisMonth: 2,
  paidThisMonth: 35000,
  paidChangePercent: 10,
};

const mockChart: RevenueChart = {
  labels: ["Nov", "Dec", "Jan"],
  totalRevenue: [10000, 20000, 30000],
  paidInvoices: [5000, 15000, 25000],
};

const mockInvoice: Invoice = {
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
};

const mockPagedResult: PagedResult<Invoice> = {
  items: [mockInvoice],
  totalCount: 1,
  pageNumber: 1,
  pageSize: 5,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe("DashboardComponent", () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashboardSvc: { getStats: jest.Mock; getRevenueChart: jest.Mock };
  let invoiceSvc: {
    getInvoices: jest.Mock;
    updateStatus: jest.Mock;
    downloadPdf: jest.Mock;
  };

  beforeEach(async () => {
    dashboardSvc = {
      getStats: jest.fn().mockReturnValue(of(mockStats)),
      getRevenueChart: jest.fn().mockReturnValue(of(mockChart)),
    };
    invoiceSvc = {
      getInvoices: jest.fn().mockReturnValue(of(mockPagedResult)),
      updateStatus: jest.fn().mockReturnValue(of(undefined as void)),
      downloadPdf: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: DashboardService, useValue: dashboardSvc },
        { provide: InvoiceService, useValue: invoiceSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load stats on init", () => {
    expect(dashboardSvc.getStats).toHaveBeenCalledTimes(1);
    expect(component.stats).toEqual(mockStats);
  });

  it("should load recent invoices on init", () => {
    expect(invoiceSvc.getInvoices).toHaveBeenCalled();
    expect(component.recentInvoices.length).toBe(1);
    expect(component.totalInvoices).toBe(1);
  });

  it("should load revenue chart on init", () => {
    expect(dashboardSvc.getRevenueChart).toHaveBeenCalledWith("6M");
    expect(component.chartData.labels).toEqual(["Nov", "Dec", "Jan"]);
  });

  it("pendingAmount returns formatted ZAR string", () => {
    expect(component.pendingAmount).toContain("R");
    expect(component.pendingAmount).toContain("8");
  });

  it("applyFilter resets page and reloads invoices", () => {
    component.currentPage = 3;
    component.applyFilter(InvoiceStatus.Paid);

    expect(component.filterStatus).toBe(InvoiceStatus.Paid);
    expect(component.currentPage).toBe(1);
    expect(invoiceSvc.getInvoices).toHaveBeenCalledTimes(2); // init + filter
  });

  it("changePage does not go below page 1", () => {
    component.currentPage = 1;
    component.changePage(0);
    expect(component.currentPage).toBe(1);
    expect(invoiceSvc.getInvoices).toHaveBeenCalledTimes(1);
  });

  it("markAsPaid calls updateStatus then reloads invoices", () => {
    component.markAsPaid("inv-1");
    expect(invoiceSvc.updateStatus).toHaveBeenCalledWith(
      "inv-1",
      InvoiceStatus.Paid,
    );
    expect(invoiceSvc.getInvoices).toHaveBeenCalledTimes(2);
  });
});
