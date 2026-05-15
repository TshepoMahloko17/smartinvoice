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
  template: `
    <div class="max-w-2xl mx-auto space-y-5">
      <div class="flex items-center gap-3">
        <a
          mat-button
          routerLink="/invoices"
          ><mat-icon>arrow_back</mat-icon></a
        >
        <h2 class="text-xl font-semibold text-gray-900">New Invoice</h2>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="card p-6 space-y-5"
      >
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field
            appearance="outline"
            class="col-span-2"
          >
            <mat-label>Client</mat-label>
            <mat-select formControlName="clientId">
              @for (c of clients; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Issued Date</mat-label>
            <input
              matInput
              [matDatepicker]="issued"
              formControlName="issuedDate"
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="issued"
            />
            <mat-datepicker #issued />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>
            <input
              matInput
              [matDatepicker]="due"
              formControlName="dueDate"
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="due"
            />
            <mat-datepicker #due />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Currency</mat-label>
            <mat-select formControlName="currency">
              <mat-option [value]="Currency.USD">USD</mat-option>
              <mat-option [value]="Currency.EUR">EUR</mat-option>
              <mat-option [value]="Currency.GBP">GBP</mat-option>
              <mat-option [value]="Currency.ZAR">ZAR</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Line items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-700">Items</p>
            <button
              type="button"
              mat-stroked-button
              (click)="addItem()"
            >
              <mat-icon>add</mat-icon> Add item
            </button>
          </div>
          <div
            formArrayName="items"
            class="space-y-2"
          >
            @for (item of itemsArray.controls; track $index) {
              <div
                [formGroupName]="$index"
                class="flex gap-2 items-start"
              >
                <mat-form-field
                  appearance="outline"
                  class="flex-1"
                >
                  <mat-label>Description</mat-label>
                  <input
                    matInput
                    formControlName="description"
                  />
                </mat-form-field>
                <mat-form-field
                  appearance="outline"
                  class="w-20"
                >
                  <mat-label>Qty</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="quantity"
                  />
                </mat-form-field>
                <mat-form-field
                  appearance="outline"
                  class="w-28"
                >
                  <mat-label>Unit Price</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="unitPrice"
                  />
                </mat-form-field>
                <button
                  type="button"
                  mat-icon-button
                  (click)="removeItem($index)"
                  class="mt-1"
                >
                  <mat-icon class="text-red-400">delete</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>

        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Notes</mat-label>
          <textarea
            matInput
            formControlName="notes"
            rows="3"
          ></textarea>
        </mat-form-field>

        <div class="flex justify-end gap-3">
          <a
            mat-stroked-button
            routerLink="/invoices"
            >Cancel</a
          >
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || saving"
          >
            {{ saving ? "Saving…" : "Create Invoice" }}
          </button>
        </div>
      </form>
    </div>
  `,
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
