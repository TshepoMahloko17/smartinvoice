import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
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
  selector: "app-invoice-form",
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
  templateUrl: './invoice-form.component.html',
})
export class InvoiceFormComponent implements OnInit {
  private readonly svc = inject(InvoiceService);
  private readonly clientSvc = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly Currency = Currency;
  clients: Client[] = [];
  saving = false;

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
    this.clientSvc.getClients().subscribe((r) => (this.clients = r.items));
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
      .create({
        ...v,
        issuedDate: new Date(v.issuedDate).toISOString(),
        dueDate: new Date(v.dueDate).toISOString(),
      })
      .subscribe({
        next: (inv) => this.router.navigate(["/invoices", inv.id]),
        error: () => {
          this.saving = false;
        },
      });
  }
}
