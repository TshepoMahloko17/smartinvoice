import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { PaymentService } from "../../services/payment.service";
import { InvoiceService } from "../../../invoices/services/invoice.service";
import { Invoice } from "../../../../shared/models/invoice.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";

@Component({
  selector: "app-payment-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(PaymentService);
  private readonly invoiceSvc = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  invoices: Invoice[] = [];
  selectedInvoice: Invoice | null = null;
  saving = false;
  private invoiceIdFromRoute: string | null = null;

  form = this.fb.group({
    invoiceId: ["", Validators.required],
    amount: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    method: [""],
    reference: [""],
  });

  ngOnInit(): void {
    this.invoiceIdFromRoute =
      this.route.snapshot.queryParamMap.get("invoiceId");
    // Load all invoices that can still accept payments (Pending or PartiallyPaid)
    this.invoiceSvc.getInvoices({ page: 1, pageSize: 100 }).subscribe((r) => {
      this.invoices = r.items.filter(
        (inv) =>
          inv.status === InvoiceStatus.Pending ||
          inv.status === InvoiceStatus.PartiallyPaid ||
          inv.status === InvoiceStatus.Overdue,
      );
      if (this.invoiceIdFromRoute) {
        this.form.patchValue({ invoiceId: this.invoiceIdFromRoute });
        this.onInvoiceChange(this.invoiceIdFromRoute);
      }
    });
  }

  onInvoiceChange(invoiceId: string): void {
    this.selectedInvoice =
      this.invoices.find((i) => i.id === invoiceId) ?? null;
    const amountCtrl = this.form.get("amount")!;
    if (this.selectedInvoice) {
      amountCtrl.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.selectedInvoice.balance),
      ]);
    } else {
      amountCtrl.setValidators([Validators.required, Validators.min(0.01)]);
    }
    amountCtrl.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.svc
      .record(
        v.invoiceId!,
        v.amount!,
        v.method || undefined,
        v.reference || undefined,
      )
      .subscribe({
        next: () => {
          const dest = this.invoiceIdFromRoute
            ? ["/invoices", this.invoiceIdFromRoute]
            : ["/payments"];
          this.router.navigate(dest);
        },
        error: () => (this.saving = false),
      });
  }
}
