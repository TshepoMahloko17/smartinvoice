import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ClientService } from "../../services/client.service";

@Component({
  selector: "app-client-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="max-w-lg mx-auto space-y-5">
      <div class="flex items-center gap-3">
        <a
          mat-button
          routerLink="/clients"
          ><mat-icon>arrow_back</mat-icon></a
        >
        <h2 class="text-xl font-semibold text-gray-900">New Client</h2>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="card p-6 space-y-4"
      >
        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Full Name *</mat-label>
          <input
            matInput
            formControlName="name"
          />
        </mat-form-field>
        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Email *</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
          />
        </mat-form-field>
        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Phone</mat-label>
          <input
            matInput
            formControlName="phone"
          />
        </mat-form-field>
        <mat-form-field
          appearance="outline"
          class="w-full"
        >
          <mat-label>Company</mat-label>
          <input
            matInput
            formControlName="companyName"
          />
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <a
            mat-stroked-button
            routerLink="/clients"
            >Cancel</a
          >
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || saving"
          >
            {{ saving ? "Saving…" : "Create Client" }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ClientFormComponent {
  private readonly svc = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  saving = false;

  form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    phone: [""],
    companyName: [""],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.svc.create(this.form.getRawValue()).subscribe({
      next: (c) => this.router.navigate(["/clients", c.id]),
      error: () => {
        this.saving = false;
      },
    });
  }
}
