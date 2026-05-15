import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { switchMap, filter } from "rxjs";
import { PaymentService } from "../../services/payment.service";
import { Payment } from "../../../../shared/models/payment.model";
import { PagedResult } from "../../../../shared/models/api-response.model";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-payment-list",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Payments</h2>
        <a
          mat-flat-button
          color="primary"
          routerLink="/payments/new"
          class="text-sm flex items-center gap-1"
        >
          <mat-icon style="font-size:16px; width:16px; height:16px;"
            >add</mat-icon
          >
          Record Payment
        </a>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-gray-500 text-xs uppercase tracking-wide">
              <th class="px-4 py-3 text-left">Invoice</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3 text-left">Method</th>
              <th class="px-4 py-3 text-left">Reference</th>
              <th class="px-4 py-3 text-left">Date</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of result?.items; track p.id) {
              <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-[#0052cb]">
                  {{ p.invoiceNumber }}
                </td>
                <td class="px-4 py-3 text-right font-semibold">
                  {{ p.amount | currency: "ZAR" : "R" }}
                </td>
                <td class="px-4 py-3 text-gray-500">{{ p.method ?? "—" }}</td>
                <td class="px-4 py-3 text-gray-500">
                  {{ p.reference ?? "—" }}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ p.paidOn | date: "mediumDate" }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    mat-icon-button
                    (click)="delete(p.id)"
                    aria-label="Delete payment"
                  >
                    <mat-icon class="text-red-400">delete</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="6"
                  class="px-4 py-8 text-center text-gray-400"
                >
                  No payments recorded.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class PaymentListComponent implements OnInit {
  private readonly svc = inject(PaymentService);
  private readonly dialog = inject(MatDialog);
  result: PagedResult<Payment> | null = null;

  ngOnInit(): void {
    this.svc.getPayments().subscribe((r) => (this.result = r));
  }

  delete(id: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: "Delete Payment", message: "Are you sure you want to delete this payment? This action cannot be undone." },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(id)),
      )
      .subscribe(() => {
        if (this.result)
          this.result = {
            ...this.result,
            items: this.result.items.filter((p) => p.id !== id),
          };
      });
  }
}
