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
  templateUrl: './client-form.component.html',
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
