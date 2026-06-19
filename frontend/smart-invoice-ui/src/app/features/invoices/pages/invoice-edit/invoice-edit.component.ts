import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { InvoiceService } from "../../services/invoice.service";
import { ClientService } from "../../../clients/services/client.service";
import { Client } from "../../../../shared/models/client.model";
import { Currency } from "../../../../shared/enums/currency.enum";

@Component({
  selector: "app-invoice-edit",
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
    MatDatepickerModule,
  ],
  templateUrl: './invoice-edit.component.html',
})
export class InvoiceEditComponent implements OnInit {
  private readonly svc = inject(InvoiceService);
  private readonly clientSvc = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly Currency = Currency;
  clients: Client[] = [];
  loading = true;
  saving = false;
  invoiceId = "";

  form = this.fb.nonNullable.group({
    clientId: ["", Validators.required],
    issuedDate: ["", Validators.required],
    dueDate: ["", Validators.required],
    currency: [Currency.ZAR],
    notes: [""],
    items: this.fb.array([this.createItemGroup()]),
  });

  get itemsArray(): FormArray {
    return this.form.get("items") as FormArray;
  }

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get("id") ?? "";
    this.clientSvc.getClients().subscribe((r) => (this.clients = r.items));

    this.svc.getById(this.invoiceId).subscribe({
      next: (inv) => {
        // Clear the default item row and populate with existing items
        while (this.itemsArray.length) {
          this.itemsArray.removeAt(0);
        }
        inv.items.forEach((item) => {
          this.itemsArray.push(
            this.fb.nonNullable.group({
              description: [item.description, Validators.required],
              quantity: [
                item.quantity,
                [Validators.required, Validators.min(1)],
              ],
              unitPrice: [
                item.unitPrice,
                [Validators.required, Validators.min(0)],
              ],
            }),
          );
        });

        this.form.patchValue({
          clientId: inv.clientId,
          issuedDate: inv.issuedDate,
          dueDate: inv.dueDate,
          currency: inv.currency,
          notes: inv.notes ?? "",
        });

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  createItemGroup() {
    return this.fb.nonNullable.group({
      description: ["", Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeItem(i: number): void {
    this.itemsArray.removeAt(i);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.getRawValue();
    this.svc
      .update(this.invoiceId, {
        ...v,
        issuedDate: new Date(v.issuedDate).toISOString(),
        dueDate: new Date(v.dueDate).toISOString(),
      })
      .subscribe({
        next: () => this.router.navigate(["/invoices", this.invoiceId]),
        error: () => {
          this.saving = false;
        },
      });
  }
}
