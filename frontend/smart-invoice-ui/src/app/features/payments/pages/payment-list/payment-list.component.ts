import { Component, OnInit, inject, signal } from "@angular/core";
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
  templateUrl: './payment-list.component.html',
})
export class PaymentListComponent implements OnInit {
  private readonly svc = inject(PaymentService);
  private readonly dialog = inject(MatDialog);
  readonly result = signal<PagedResult<Payment> | null>(null);

  ngOnInit(): void {
    this.svc.getPayments().subscribe((r) => this.result.set(r));
  }

  delete(id: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Payment",
          message:
            "Are you sure you want to delete this payment? This action cannot be undone.",
        },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(id)),
      )
      .subscribe(() => {
        const cur = this.result();
        if (cur)
          this.result.set({
            ...cur,
            items: cur.items.filter((p) => p.id !== id),
          });
      });
  }
}
