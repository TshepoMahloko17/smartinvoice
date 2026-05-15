import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ContractService } from "../../services/contract.service";
import { ClientService } from "../../../clients/services/client.service";
import { Client } from "../../../../shared/models/client.model";

@Component({
  selector: "app-contract-form",
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
          routerLink="/contracts"
          ><mat-icon>arrow_back</mat-icon></a
        >
        <h2 class="text-xl font-semibold text-gray-900">New Contract</h2>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="card p-6 space-y-5"
      >
        <mat-form-field class="w-full">
          <mat-label>Title</mat-label>
          <input
            matInput
            formControlName="title"
            placeholder="e.g. Web Development Agreement"
          />
          @if (form.get("title")?.invalid && form.get("title")?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-full">
          <mat-label>Client</mat-label>
          <mat-select formControlName="clientId">
            @for (c of clients; track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
          @if (form.get("clientId")?.invalid && form.get("clientId")?.touched) {
            <mat-error>Client is required</mat-error>
          }
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Start Date</mat-label>
            <input
              matInput
              [matDatepicker]="startPicker"
              formControlName="startDate"
            />
            <mat-datepicker-toggle
              matIconSuffix
              [for]="startPicker"
            />
            <mat-datepicker #startPicker />
            @if (
              form.get("startDate")?.invalid && form.get("startDate")?.touched
            ) {
              <mat-error>Start date is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>End Date (optional)</mat-label>
            <input
              matInput
              [matDatepicker]="endPicker"
              formControlName="endDate"
            />
            <mat-datepicker-toggle
              matIconSuffix
              [for]="endPicker"
            />
            <mat-datepicker #endPicker />
          </mat-form-field>
        </div>

        <mat-form-field class="w-full">
          <mat-label>Content / Terms</mat-label>
          <textarea
            matInput
            formControlName="content"
            rows="6"
            placeholder="Enter contract terms and conditions..."
          ></textarea>
          @if (form.get("content")?.invalid && form.get("content")?.touched) {
            <mat-error>Content is required</mat-error>
          }
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <a
            mat-button
            routerLink="/contracts"
            >Cancel</a
          >
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || saving"
          >
            {{ saving ? "Creating..." : "Create Contract" }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ContractFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(ContractService);
  private readonly clientSvc = inject(ClientService);
  private readonly router = inject(Router);

  clients: Client[] = [];
  saving = false;

  form = this.fb.group({
    title: ["", Validators.required],
    clientId: ["", Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null],
    content: ["", Validators.required],
  });

  ngOnInit(): void {
    this.clientSvc
      .getClients(1, 100)
      .subscribe((r) => (this.clients = r.items));
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    this.svc
      .create({
        title: v.title!,
        clientId: v.clientId!,
        startDate: v.startDate ? new Date(v.startDate).toISOString() : "",
        endDate: v.endDate ? new Date(v.endDate).toISOString() : undefined,
        content: v.content!,
      })
      .subscribe({
        next: () => this.router.navigate(["/contracts"]),
        error: () => (this.saving = false),
      });
  }
}
