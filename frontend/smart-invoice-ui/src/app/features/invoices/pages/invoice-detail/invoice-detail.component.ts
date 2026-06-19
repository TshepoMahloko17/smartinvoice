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
  templateUrl: './invoice-detail.component.html',
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
