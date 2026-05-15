import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { InvoiceService, InvoiceQuery } from "../../services/invoice.service";
import { StatusBadgeComponent } from "../../../../shared/components/status-badge/status-badge.component";
import { Invoice } from "../../../../shared/models/invoice.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { PagedResult } from "../../../../shared/models/api-response.model";

@Component({
  selector: "app-invoice-list",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Invoices</h2>
        <a
          mat-flat-button
          color="primary"
          routerLink="/invoices/new"
        >
          <mat-icon>add</mat-icon> New Invoice
        </a>
      </div>

      <!-- Filters -->
      <div class="card p-4 flex gap-3 flex-wrap">
        <mat-form-field
          appearance="outline"
          class="flex-1 min-w-48"
        >
          <mat-label>Search</mat-label>
          <input
            matInput
            [(ngModel)]="search"
            (ngModelChange)="onFilter()"
            placeholder="Invoice #, client…"
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field
          appearance="outline"
          class="w-40"
        >
          <mat-label>Status</mat-label>
          <mat-select
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilter()"
          >
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="InvoiceStatus.Draft">Draft</mat-option>
            <mat-option [value]="InvoiceStatus.Pending">Pending</mat-option>
            <mat-option [value]="InvoiceStatus.Paid">Paid</mat-option>
            <mat-option [value]="InvoiceStatus.Overdue">Overdue</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide"
            >
              <th class="px-4 py-3 text-left">Invoice #</th>
              <th class="px-4 py-3 text-left">Client</th>
              <th class="px-4 py-3 text-left">Issued</th>
              <th class="px-4 py-3 text-left">Due</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3 text-center">Status</th>
              <th class="px-4 py-3"></th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (inv of result?.items; track inv.id) {
              <tr
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3 font-medium text-[#0052cb]">
                  {{ inv.invoiceNumber }}
                </td>
                <td class="px-4 py-3 text-gray-900">{{ inv.clientName }}</td>
                <td class="px-4 py-3 text-gray-500">
                  {{ inv.issuedDate | date: "mediumDate" }}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ inv.dueDate | date: "mediumDate" }}
                </td>
                <td class="px-4 py-3 text-right font-medium">
                  {{ inv.total | currency: "ZAR" : "R" }}
                </td>
                <td class="px-4 py-3 text-center">
                  <app-status-badge [status]="inv.status" />
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    mat-icon-button
                    [disabled]="downloadingId === inv.id"
                    (click)="downloadPdf(inv.id, inv.invoiceNumber)"
                    title="Download PDF"
                  >
                    <mat-icon
                      class="text-gray-400"
                      style="font-size:18px; width:18px; height:18px;"
                    >
                      {{
                        downloadingId === inv.id
                          ? "hourglass_empty"
                          : "download"
                      }}
                    </mat-icon>
                  </button>
                </td>
                <td class="px-4 py-3 text-right">
                  <a
                    mat-icon-button
                    [routerLink]="['/invoices', inv.id]"
                  >
                    <mat-icon class="text-gray-400">chevron_right</mat-icon>
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="8"
                  class="px-4 py-8 text-center text-gray-400"
                >
                  No invoices found.
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pagination -->
        @if (result && result.totalPages > 1) {
          <div
            class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
          >
            <span class="text-xs text-gray-500">
              Page {{ result.pageNumber }} of {{ result.totalPages }} ({{
                result.totalCount
              }}
              total)
            </span>
            <div class="flex gap-2">
              <button
                mat-stroked-button
                [disabled]="!result.hasPreviousPage"
                (click)="goToPage(page - 1)"
              >
                Prev
              </button>
              <button
                mat-stroked-button
                [disabled]="!result.hasNextPage"
                (click)="goToPage(page + 1)"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class InvoiceListComponent implements OnInit {
  private readonly svc = inject(InvoiceService);

  readonly InvoiceStatus = InvoiceStatus;
  result: PagedResult<Invoice> | null = null;
  page = 1;
  search = "";
  statusFilter: InvoiceStatus | null = null;
  downloadingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  onFilter(): void {
    this.page = 1;
    this.load();
  }
  goToPage(p: number): void {
    this.page = p;
    this.load();
  }

  downloadPdf(id: string, invoiceNumber: string): void {
    this.downloadingId = id;
    this.svc.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: () => {
        this.downloadingId = null;
      },
    });
  }

  private load(): void {
    const q: InvoiceQuery = { page: this.page, pageSize: 10 };
    if (this.search) q.search = this.search;
    if (this.statusFilter != null) q.status = this.statusFilter;
    this.svc.getInvoices(q).subscribe((r) => (this.result = r));
  }
}
