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
  template: `
    <div class="space-y-6">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <app-stat-card
          label="TOTAL REVENUE"
          [value]="
            (stats()?.totalRevenue | currency: 'ZAR' : 'R' : '1.0-0') ?? 'R0'
          "
          icon="receipt_long"
          iconColor="#0052cb"
          iconBg="#e8f0fe"
          [change]="stats()?.revenueChangePercent"
          [changeLabel]="
            stats() &&
            stats()!.revenueChangePercent == null &&
            stats()!.totalRevenue > 0
              ? 'New'
              : undefined
          "
          subtitle="vs last month"
        />
        <app-stat-card
          label="PENDING INVOICES"
          [value]="stats()?.pendingInvoicesCount?.toString() ?? '0'"
          icon="pending_actions"
          iconColor="#f97316"
          iconBg="#fff7ed"
          [change]="stats()?.pendingChangePercent"
          [changeLabel]="
            stats() &&
            stats()!.pendingChangePercent == null &&
            stats()!.pendingInvoicesCount > 0
              ? 'New'
              : undefined
          "
          [subtitle]="pendingAmount() + ' total pending'"
        />
        <app-stat-card
          label="ACTIVE CLIENTS"
          [value]="stats()?.activeClientsCount?.toString() ?? '0'"
          icon="group"
          iconColor="#0ea5e9"
          iconBg="#e0f2fe"
          [changeLabel]="
            stats() ? '+ ' + stats()!.newClientsThisMonth + ' new' : undefined
          "
          subtitle="this month growth"
        />
        <app-stat-card
          label="PAID THIS MONTH"
          [value]="
            (stats()?.paidThisMonth | currency: 'ZAR' : 'R' : '1.0-0') ?? 'R0'
          "
          icon="verified"
          iconColor="#10b981"
          iconBg="#d1fae5"
          [change]="stats()?.paidChangePercent"
          [changeLabel]="
            stats() &&
            stats()!.paidChangePercent == null &&
            stats()!.paidThisMonth > 0
              ? 'New'
              : undefined
          "
          subtitle="Highest record year-to-date"
        />
      </div>

      <!-- Recent Invoices table -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          <div class="flex gap-2">
            <button
              class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
              [matMenuTriggerFor]="filterMenu"
            >
              <mat-icon style="font-size:16px; width:16px; height:16px;"
                >filter_list</mat-icon
              >
              {{ filterStatus() === null ? "Filter" : filterStatusLabel() }}
            </button>
            <mat-menu #filterMenu="matMenu">
              <button
                mat-menu-item
                (click)="applyFilter(null)"
              >
                All
              </button>
              <button
                mat-menu-item
                (click)="applyFilter(InvoiceStatus.Draft)"
              >
                Draft
              </button>
              <button
                mat-menu-item
                (click)="applyFilter(InvoiceStatus.Pending)"
              >
                Pending
              </button>
              <button
                mat-menu-item
                (click)="applyFilter(InvoiceStatus.Paid)"
              >
                Paid
              </button>
              <button
                mat-menu-item
                (click)="applyFilter(InvoiceStatus.Overdue)"
              >
                Overdue
              </button>
              <button
                mat-menu-item
                (click)="applyFilter(InvoiceStatus.Cancelled)"
              >
                Cancelled
              </button>
            </mat-menu>
            <a
              routerLink="/invoices/new"
              class="flex items-center gap-2 px-6 py-2 bg-primary-container text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-md"
              style="text-decoration:none;"
            >
              <mat-icon style="font-size:16px; width:16px; height:16px;"
                >add</mat-icon
              >
              Create Invoice
            </a>
          </div>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Invoice ID
              </th>
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Client
              </th>
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Date
              </th>
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Due Date
              </th>
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Amount
              </th>
              <th
                class="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                Status
              </th>
              <th class="pb-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            @for (inv of recentInvoices(); track inv.id) {
              <tr
                class="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
              >
                <td class="py-3 pr-4">
                  <a
                    [routerLink]="['/invoices', inv.id]"
                    class="text-blue-600 font-medium hover:underline"
                  >
                    #{{ inv.invoiceNumber }}
                  </a>
                </td>
                <td class="py-3 pr-4">
                  <p class="font-medium text-gray-900">{{ inv.clientName }}</p>
                  <p class="text-xs text-gray-400">{{ inv.clientEmail }}</p>
                </td>
                <td class="py-3 pr-4 text-gray-500">
                  {{ inv.issuedDate | date: "d MMM yyyy" }}
                </td>
                <td class="py-3 pr-4 text-gray-500">
                  {{ inv.dueDate | date: "d MMM yyyy" }}
                </td>
                <td class="py-3 pr-4 font-semibold text-gray-900">
                  {{ inv.total | currency: "ZAR" : "R" }}
                </td>
                <td class="py-3 pr-4">
                  <app-status-badge [status]="inv.status" />
                </td>
                <td class="py-3">
                  <button
                    mat-icon-button
                    class="text-gray-400"
                    [matMenuTriggerFor]="rowMenu"
                    [matMenuTriggerData]="{ inv: inv }"
                    aria-label="Invoice actions"
                  >
                    <mat-icon style="font-size:18px;">more_vert</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="7"
                  class="py-10 text-center text-gray-400 text-sm"
                >
                  No invoices yet.
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div
          class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500"
        >
          <span
            >Showing
            <span class="font-bold text-slate-900">{{
              recentInvoices().length
            }}</span>
            of
            <span class="font-bold text-slate-900">{{ totalInvoices() }}</span>
            invoices</span
          >
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                class="bg-transparent border-none text-sm font-bold focus:outline-none cursor-pointer"
                (change)="
                  pageSize.set(+$any($event.target).value); onPageSizeChange()
                "
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div
              class="flex items-center border border-slate-200 rounded-lg divide-x divide-slate-200 overflow-hidden"
            >
              <button
                class="p-2 hover:bg-slate-50 text-slate-400 transition-colors border-0 bg-transparent outline-none cursor-pointer disabled:opacity-30"
                [disabled]="currentPage() === 1"
                (click)="changePage(currentPage() - 1)"
              >
                <mat-icon style="font-size:16px; width:16px; height:16px;"
                  >chevron_left</mat-icon
                >
              </button>
              @for (p of visiblePages(); track p) {
                <button
                  class="px-3.5 py-2 text-sm font-medium transition-colors border-0 outline-none cursor-pointer"
                  [class.text-white]="currentPage() === p"
                  [class.text-slate-600]="currentPage() !== p"
                  [style.background]="
                    currentPage() === p ? '#0052cb' : 'transparent'
                  "
                  (click)="changePage(p)"
                >
                  {{ p }}
                </button>
              }
              <button
                class="p-2 hover:bg-slate-50 text-slate-400 transition-colors border-0 bg-transparent outline-none cursor-pointer disabled:opacity-30"
                [disabled]="currentPage() === totalPages()"
                (click)="changePage(currentPage() + 1)"
              >
                <mat-icon style="font-size:16px; width:16px; height:16px;"
                  >chevron_right</mat-icon
                >
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue chart -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <p class="text-sm text-gray-400">
              Comparison of total revenue vs. paid invoices
            </p>
          </div>
          <div class="flex bg-slate-100 p-1 rounded-lg">
            @for (p of ["3M", "6M", "1Y"]; track p) {
              <button
                (click)="activePeriod.set(p); loadChart(p)"
                class="px-3 py-1 text-xs font-semibold transition-colors rounded-md border-0 outline-none cursor-pointer"
                [class.text-white]="activePeriod() === p"
                [class.shadow-sm]="activePeriod() === p"
                [class.text-slate-600]="activePeriod() !== p"
                [style.background]="
                  activePeriod() === p ? '#1d6af5' : 'transparent'
                "
              >
                {{ p }}
              </button>
            }
          </div>
        </div>
        <div class="flex gap-4 mb-4">
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              class="inline-block w-3 h-0.5 rounded"
              style="background:#0052cb;"
            ></span>
            Total Revenue
          </span>
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              class="inline-block w-3 h-0.5 rounded"
              style="background:#10b981;"
            ></span>
            Paid Invoices
          </span>
        </div>
        <div class="h-72">
          <canvas
            baseChart
            [data]="chartData"
            [options]="chartOptions"
            type="line"
          ></canvas>
        </div>
      </div>
      <mat-menu #rowMenu="matMenu">
        <ng-template
          matMenuContent
          let-inv="inv"
        >
          <button
            mat-menu-item
            (click)="viewInvoice(inv.id)"
          >
            <mat-icon>visibility</mat-icon>
            <span>View Invoice</span>
          </button>
          <button
            mat-menu-item
            (click)="markAsPaid(inv.id)"
            [disabled]="inv.status === InvoiceStatus.Paid"
          >
            <mat-icon>check_circle</mat-icon>
            <span>Mark as Paid</span>
          </button>
        </ng-template>
      </mat-menu>
    </div>
  `,
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
