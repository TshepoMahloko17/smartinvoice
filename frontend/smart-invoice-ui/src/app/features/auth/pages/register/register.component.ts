import { Component, inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../../core/services/auth.service";

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get("password")?.value;
  const confirm = control.get("confirmPassword")?.value;
  return password && confirm && password !== confirm
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: "app-register",
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
          <h2 class="text-lg font-semibold text-gray-900 mb-1">
            Create an account
          </h2>
          <p class="text-sm text-gray-500 mb-6">
            Fill in your details to get started
          </p>

          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-4"
          >
            <div class="flex gap-3">
              <mat-form-field
                appearance="outline"
                class="flex-1"
              >
                <mat-label>First name</mat-label>
                <input
                  matInput
                  formControlName="firstName"
                  autocomplete="given-name"
                />
                @if (
                  form.get("firstName")?.invalid &&
                  form.get("firstName")?.touched
                ) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field
                appearance="outline"
                class="flex-1"
              >
                <mat-label>Last name</mat-label>
                <input
                  matInput
                  formControlName="lastName"
                  autocomplete="family-name"
                />
                @if (
                  form.get("lastName")?.invalid && form.get("lastName")?.touched
                ) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>

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
              @if (
                form.get("email")?.hasError("email") &&
                form.get("email")?.touched
              ) {
                <mat-error>Enter a valid email</mat-error>
              }
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
                autocomplete="new-password"
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
              @if (
                form.get("password")?.hasError("minlength") &&
                form.get("password")?.touched
              ) {
                <mat-error>At least 8 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              class="w-full"
            >
              <mat-label>Confirm password</mat-label>
              <input
                matInput
                [type]="showConfirm ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              <button
                type="button"
                mat-icon-button
                matSuffix
                (click)="showConfirm = !showConfirm"
                [attr.aria-label]="
                  showConfirm
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                "
              >
                <mat-icon>{{
                  showConfirm ? "visibility_off" : "visibility"
                }}</mat-icon>
              </button>
              @if (
                form.hasError("passwordsMismatch") &&
                form.get("confirmPassword")?.touched
              ) {
                <mat-error>Passwords do not match</mat-error>
              }
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
              {{ loading ? "Creating account…" : "Create account" }}
            </button>
          </form>

          <p class="text-sm text-center text-gray-500 mt-5">
            Already have an account?
            <a
              routerLink="/auth/login"
              class="text-[#0052cb] font-medium hover:underline"
              >Sign in</a
            >
          </p>
        </mat-card>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group(
    {
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      confirmPassword: ["", Validators.required],
    },
    { validators: passwordsMatch },
  );

  showPwd = false;
  showConfirm = false;
  loading = false;
  error = "";

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = "";
    const { firstName, lastName, email, password } = this.form.getRawValue();
    this.auth.register(firstName, lastName, email, password).subscribe({
      next: () => this.router.navigate(["/dashboard"]),
      error: (err) => {
        const msg = err?.error?.errors?.Email?.[0];
        this.error = msg ?? "Registration failed. Please try again.";
        this.loading = false;
      },
    });
  }
}
