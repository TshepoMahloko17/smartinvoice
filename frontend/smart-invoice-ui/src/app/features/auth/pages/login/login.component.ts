import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#faf8ff]">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <div
            class="w-9 h-9 rounded-xl bg-[#0052cb] flex items-center justify-center"
          >
            <mat-icon class="text-white">receipt_long</mat-icon>
          </div>
          <span class="text-xl font-semibold text-gray-900">SmartInvoice</span>
        </div>

        <mat-card class="p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
          <p class="text-sm text-gray-500 mb-6">
            Enter your credentials to continue
          </p>

          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-4"
          >
            <mat-form-field
              appearance="outline"
              class="w-full"
            >
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
              />
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              class="w-full"
            >
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="showPwd ? 'text' : 'password'"
                formControlName="password"
              />
              <button
                type="button"
                mat-icon-button
                matSuffix
                (click)="showPwd = !showPwd"
                [attr.aria-label]="showPwd ? 'Hide password' : 'Show password'"
              >
                <mat-icon>{{
                  showPwd ? "visibility_off" : "visibility"
                }}</mat-icon>
              </button>
            </mat-form-field>

            @if (error) {
              <p class="text-sm text-red-500">{{ error }}</p>
            }

            <button
              mat-flat-button
              color="primary"
              class="w-full"
              type="submit"
              [disabled]="form.invalid || loading"
            >
              {{ loading ? "Signing in…" : "Sign in" }}
            </button>
          </form>

          <p class="text-sm text-center text-gray-500 mt-5">
            Don't have an account?
            <a
              routerLink="/auth/register"
              class="text-[#0052cb] font-medium hover:underline"
              >Create account</a
            >
          </p>
        </mat-card>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  showPwd = false;
  loading = false;
  error = "";

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = "";
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(["/dashboard"]),
      error: () => {
        this.error = "Invalid email or password.";
        this.loading = false;
      },
    });
  }
}
