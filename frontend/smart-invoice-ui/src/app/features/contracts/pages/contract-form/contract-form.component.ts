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
  templateUrl: './contract-form.component.html',
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
