import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { InvoiceService } from "../../services/invoice.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { StatusBadgeComponent } from "../../../../shared/components/status-badge/status-badge.component";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";

@Component({
  selector: "app-invoice-detail",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    StatusBadgeComponent,
  ],
  template: `
    @if (invoice) {
      <div class="max-w-3xl mx-auto space-y-5">
        <!-- Back + actions -->
        <div class="flex items-center justify-between">
          <a
            mat-button
            routerLink="/invoices"
            ><mat-icon>arrow_back</mat-icon> Invoices</a
          >
          <div class="flex gap-2">
            <button
              mat-stroked-button
              (click)="downloadPdf()"
            >
              <mat-icon>download</mat-icon> PDF
            </button>
            @if (
              invoice.status !== InvoiceStatus.Paid &&
              invoice.status !== InvoiceStatus.Cancelled
            ) {
              <a
                mat-stroked-button
                [routerLink]="['/invoices', invoice.id, 'edit']"
              >
                <mat-icon>edit</mat-icon> Edit
              </a>
            }
            <button
              mat-icon-button
              [matMenuTriggerFor]="menu"
            >
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu>
              <button
                mat-menu-item
                (click)="updateStatus(InvoiceStatus.Paid)"
              >
                Mark as Paid
              </button>
              <button
                mat-menu-item
                (click)="updateStatus(InvoiceStatus.Cancelled)"
              >
                Cancel
              </button>
              <button
                mat-menu-item
                class="text-red-500"
                (click)="deleteInvoice()"
              >
                Delete
              </button>
            </mat-menu>
          </div>
        </div>

        <div class="card p-6 space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500">Invoice</p>
              <h2 class="text-2xl font-semibold text-gray-900">
                {{ invoice.invoiceNumber }}
              </h2>
            </div>
            <app-status-badge [status]="invoice.status" />
          </div>

          <!-- Client & dates -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Client</p>
              <p class="font-medium">{{ invoice.clientName }}</p>
              <p class="text-gray-500">{{ invoice.clientEmail }}</p>
            </div>
            <div class="text-right">
              <p class="text-gray-500">
                Issued: {{ invoice.issuedDate | date: "mediumDate" }}
              </p>
              <p class="text-gray-500">
                Due: {{ invoice.dueDate | date: "mediumDate" }}
              </p>
            </div>
          </div>

          <!-- Items -->
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-gray-500 text-xs uppercase">
                <th class="py-2 text-left">Description</th>
                <th class="py-2 text-right">Qty</th>
                <th class="py-2 text-right">Unit Price</th>
                <th class="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of invoice.items; track item.id) {
                <tr class="border-b border-gray-50">
                  <td class="py-2">{{ item.description }}</td>
                  <td class="py-2 text-right">{{ item.quantity }}</td>
                  <td class="py-2 text-right">
                    {{ item.unitPrice | currency: "ZAR" : "R" }}
                  </td>
                  <td class="py-2 text-right font-medium">
                    {{ item.lineTotal | currency: "ZAR" : "R" }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td
                  colspan="3"
                  class="pt-4 text-right font-semibold"
                >
                  Total
                </td>
                <td class="pt-4 text-right text-lg font-bold text-[#0052cb]">
                  {{ invoice.total | currency: "ZAR" : "R" }}
                </td>
              </tr>
            </tfoot>
          </table>

          @if (invoice.notes) {
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p class="text-sm text-gray-700">{{ invoice.notes }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly svc = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly InvoiceStatus = InvoiceStatus;
  invoice: Invoice | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id")!;
      this.invoice = null;
      this.svc.getById(id).subscribe((inv) => (this.invoice = inv));
    });
  }

  updateStatus(status: InvoiceStatus): void {
    this.svc.updateStatus(this.invoice!.id, status).subscribe(() => {
      this.invoice = { ...this.invoice!, status };
    });
  }

  deleteInvoice(): void {
    this.svc
      .delete(this.invoice!.id)
      .subscribe(() => this.router.navigate(["/invoices"]));
  }

  downloadPdf(): void {
    this.svc.downloadPdf(this.invoice!.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.invoice!.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
