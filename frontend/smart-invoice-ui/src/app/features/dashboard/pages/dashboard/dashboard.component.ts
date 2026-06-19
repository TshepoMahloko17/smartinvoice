import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { BaseChartDirective } from "ng2-charts";
import { ChartConfiguration, ChartData } from "chart.js";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { StatCardComponent } from "../../../../shared/components/stat-card/stat-card.component";
import { StatusBadgeComponent } from "../../../../shared/components/status-badge/status-badge.component";
import { DashboardService } from "../../services/dashboard.service";
import {
  DashboardStats,
  RevenueChart,
} from "../../../../shared/models/dashboard-stats.model";
import { InvoiceService } from "../../../invoices/services/invoice.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import {
  InvoiceStatus,
  InvoiceStatusLabels,
} from "../../../../shared/enums/invoice-status.enum";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    BaseChartDirective,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardSvc = inject(DashboardService);
  private readonly invoiceSvc = inject(InvoiceService);
  private readonly router = inject(Router);

  readonly stats = signal<DashboardStats | null>(null);
  readonly recentInvoices = signal<Invoice[]>([]);
  readonly totalInvoices = signal(0);
  readonly activePeriod = signal("6M");
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly filterStatus = signal<InvoiceStatus | null>(null);
  readonly InvoiceStatus = InvoiceStatus;

  readonly pendingAmount = computed(() => {
    const s = this.stats();
    if (!s) return "R0";
    return (
      "R" +
      new Intl.NumberFormat("en-ZA", {
        maximumFractionDigits: 0,
      }).format(s.pendingInvoicesTotal)
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalInvoices() / this.pageSize())),
  );

  readonly visiblePages = computed(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(this.totalPages(), 3); i++) pages.push(i);
    return pages;
  });

  readonly filterStatusLabel = computed(() =>
    this.filterStatus() !== null
      ? InvoiceStatusLabels[this.filterStatus()!]
      : "All",
  );

  chartData: ChartData<"line"> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `R${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        border: { display: false },
        ticks: {
          callback: (v) => {
            const n = Number(v);
            if (n >= 1_000_000)
              return `R${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
            if (n >= 1_000)
              return `R${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
            return `R${n}`;
          },
        },
      },
    },
  };

  ngOnInit(): void {
    this.dashboardSvc.getStats().subscribe((s) => this.stats.set(s));
    this.loadChart("6M");
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.invoiceSvc
      .getInvoices({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        status: this.filterStatus() ?? undefined,
      })
      .subscribe((r) => {
        this.recentInvoices.set(r.items);
        this.totalInvoices.set(r.totalCount);
      });
  }

  applyFilter(status: InvoiceStatus | null): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadInvoices();
  }

  viewInvoice(id: string): void {
    this.router.navigate(["/invoices", id]);
  }

  markAsPaid(id: string): void {
    this.invoiceSvc
      .updateStatus(id, InvoiceStatus.Paid)
      .subscribe(() => this.loadInvoices());
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadInvoices();
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.loadInvoices();
  }

  loadChart(period: string): void {
    this.dashboardSvc
      .getRevenueChart(period)
      .subscribe((c) => this.buildChart(c));
  }

  private buildChart(data: RevenueChart): void {
    this.chartData = {
      labels: data.labels,
      datasets: [
        {
          data: data.totalRevenue,
          borderColor: "#0052cb",
          backgroundColor: "rgba(0,82,203,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0052cb",
          pointBorderWidth: 2,
        },
        {
          data: data.paidInvoices,
          borderColor: "#10b981",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#10b981",
          pointBorderWidth: 2,
        },
      ],
    };
  }
}
