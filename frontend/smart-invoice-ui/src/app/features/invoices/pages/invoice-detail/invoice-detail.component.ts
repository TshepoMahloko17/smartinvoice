import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialog } from "@angular/material/dialog";
import { filter, switchMap } from "rxjs";
import { InvoiceService } from "../../services/invoice.service";
import { PaymentService } from "../../../../features/payments/services/payment.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { Payment } from "../../../../shared/models/payment.model";
import { StatusBadgeComponent } from "../../../../shared/components/status-badge/status-badge.component";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-invoice-detail",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
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
              aria-label="Invoice actions"
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

        <!-- Payment History -->
        <div class="card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900">
              Payment History
            </h3>
            <a
              mat-stroked-button
              [routerLink]="['/payments/new']"
              [queryParams]="{ invoiceId: invoice.id }"
            >
              <mat-icon>add</mat-icon> Record Payment
            </a>
          </div>

          @if (payments.length === 0) {
            <p class="text-sm text-gray-400 py-2">No payments recorded yet.</p>
          } @else {
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-gray-500 text-xs uppercase">
                  <th class="py-2 text-left">Date</th>
                  <th class="py-2 text-left">Method</th>
                  <th class="py-2 text-left">Reference</th>
                  <th class="py-2 text-right">Amount</th>
                  <th class="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                @for (payment of payments; track payment.id) {
                  <tr class="border-b border-gray-50">
                    <td class="py-2">
                      {{ payment.paidOn | date: "mediumDate" }}
                    </td>
                    <td class="py-2 text-gray-600">
                      {{ payment.method || "—" }}
                    </td>
                    <td class="py-2 text-gray-600">
                      {{ payment.reference || "—" }}
                    </td>
                    <td class="py-2 text-right font-medium text-[#0052cb]">
                      {{ payment.amount | currency: "ZAR" : "R" }}
                    </td>
                    <td class="py-2 text-right">
                      <button
                        mat-icon-button
                        class="text-red-400"
                        aria-label="Delete payment"
                        (click)="deletePayment(payment)"
                      >
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colspan="3"
                    class="pt-3 text-right text-xs text-gray-500 uppercase"
                  >
                    Total Paid
                  </td>
                  <td class="pt-3 text-right font-semibold text-green-600">
                    {{ totalPaid | currency: "ZAR" : "R" }}
                  </td>
                  <td></td>
                </tr>
                @if (invoice.balance > 0) {
                  <tr>
                    <td
                      colspan="3"
                      class="pt-1 text-right text-xs text-gray-500 uppercase"
                    >
                      Balance Due
                    </td>
                    <td class="pt-1 text-right font-semibold text-orange-600">
                      {{ invoice.balance | currency: "ZAR" : "R" }}
                    </td>
                    <td></td>
                  </tr>
                }
              </tfoot>
            </table>
          }
        </div>
      </div>
    }
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly svc = inject(InvoiceService);
  private readonly paymentSvc = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly InvoiceStatus = InvoiceStatus;
  invoice: Invoice | null = null;
  payments: Payment[] = [];

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id")!;
      this.invoice = null;
      this.payments = [];
      this.svc.getById(id).subscribe((inv) => {
        this.invoice = inv;
        this.loadPayments(id);
      });
    });
  }

  private loadPayments(invoiceId: string): void {
    this.paymentSvc
      .getByInvoice(invoiceId)
      .subscribe((result) => (this.payments = result.items as Payment[]));
  }

  updateStatus(status: InvoiceStatus): void {
    this.svc.updateStatus(this.invoice!.id, status).subscribe(() => {
      this.invoice = { ...this.invoice!, status };
    });
  }

  deletePayment(payment: Payment): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Payment",
          message: `Remove this payment of R${payment.amount.toFixed(2)}? This cannot be undone.`,
        },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.paymentSvc.delete(payment.id)),
        switchMap(() => this.svc.getById(this.invoice!.id)),
      )
      .subscribe((updated) => {
        this.invoice = updated;
        this.payments = this.payments.filter((p) => p.id !== payment.id);
      });
  }

  deleteInvoice(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Invoice",
          message: `Are you sure you want to delete invoice ${this.invoice!.invoiceNumber}? This action cannot be undone.`,
        },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(this.invoice!.id)),
      )
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
