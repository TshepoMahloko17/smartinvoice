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
  template: `
    <div class="max-w-xl mx-auto space-y-5">
      <div class="flex items-center gap-3">
        <a
          mat-button
          routerLink="/payments"
          ><mat-icon>arrow_back</mat-icon></a
        >
        <h2 class="text-xl font-semibold text-gray-900">Record Payment</h2>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="card p-6 space-y-5"
      >
        <mat-form-field class="w-full">
          <mat-label>Invoice</mat-label>
          <mat-select
            formControlName="invoiceId"
            (selectionChange)="onInvoiceChange($event.value)"
          >
            @for (inv of invoices; track inv.id) {
              <mat-option [value]="inv.id">
                #{{ inv.invoiceNumber }} — {{ inv.clientName }}
              </mat-option>
            }
          </mat-select>
          @if (
            form.get("invoiceId")?.invalid && form.get("invoiceId")?.touched
          ) {
            <mat-error>Invoice is required</mat-error>
          }
        </mat-form-field>

        @if (selectedInvoice) {
          <div class="text-sm text-gray-600 -mt-2 flex justify-between">
            <span
              >Invoice total:
              <strong
                >R{{ selectedInvoice.total | number: "1.2-2" }}</strong
              ></span
            >
            <span
              >Outstanding:
              <strong class="text-orange-600"
                >R{{ selectedInvoice.balance | number: "1.2-2" }}</strong
              ></span
            >
          </div>
        }

        <mat-form-field class="w-full">
          <mat-label>Amount (R)</mat-label>
          <input
            matInput
            type="number"
            formControlName="amount"
            [attr.min]="0.01"
            [attr.max]="selectedInvoice?.balance ?? null"
            step="0.01"
          />
          @if (
            form.get("amount")?.hasError("required") &&
            form.get("amount")?.touched
          ) {
            <mat-error>A valid amount is required</mat-error>
          }
          @if (form.get("amount")?.hasError("max")) {
            <mat-error
              >Amount exceeds the outstanding balance of R{{
                selectedInvoice?.balance | number: "1.2-2"
              }}</mat-error
            >
          }
          @if (
            form.get("amount")?.hasError("min") &&
            !form.get("amount")?.hasError("required")
          ) {
            <mat-error>Amount must be greater than 0</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Payment Method (optional)</mat-label>
          <mat-select formControlName="method">
            <mat-option value="">— None —</mat-option>
            <mat-option value="Bank Transfer">Bank Transfer</mat-option>
            <mat-option value="Credit Card">Credit Card</mat-option>
            <mat-option value="Cash">Cash</mat-option>
            <mat-option value="EFT">EFT</mat-option>
            <mat-option value="PayPal">PayPal</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Reference (optional)</mat-label>
          <input
            matInput
            formControlName="reference"
            placeholder="e.g. POP-20260506"
          />
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <a
            mat-button
            routerLink="/payments"
            >Cancel</a
          >
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || saving"
          >
            {{ saving ? "Recording..." : "Record Payment" }}
          </button>
        </div>
      </form>
    </div>
  `,
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
