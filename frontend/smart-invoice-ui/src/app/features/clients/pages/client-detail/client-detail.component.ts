import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { filter, switchMap } from "rxjs";
import { ClientService } from "../../services/client.service";
import { Client } from "../../../../shared/models/client.model";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-client-detail",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    @if (client) {
      <div class="max-w-2xl mx-auto space-y-5">
        <div class="flex items-center justify-between">
          <a
            mat-button
            routerLink="/clients"
            ><mat-icon>arrow_back</mat-icon> Clients</a
          >
          <button
            mat-stroked-button
            color="warn"
            (click)="deleteClient()"
          >
            <mat-icon>delete</mat-icon> Delete
          </button>
        </div>

        <div class="card p-6 space-y-4">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#0052cb] text-xl font-semibold"
            >
              {{ client.name[0].toUpperCase() }}
            </div>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                {{ client.name }}
              </h2>
              @if (client.companyName) {
                <p class="text-sm text-gray-500">{{ client.companyName }}</p>
              }
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-gray-500">Email</p>
              <p class="font-medium">{{ client.email }}</p>
            </div>
            @if (client.phone) {
              <div>
                <p class="text-gray-500">Phone</p>
                <p class="font-medium">{{ client.phone }}</p>
              </div>
            }
            <div>
              <p class="text-gray-500">Invoices</p>
              <p class="font-semibold text-[#0052cb]">
                {{ client.totalInvoices }}
              </p>
            </div>
            <div>
              <p class="text-gray-500">Total Revenue</p>
              <p class="font-semibold">
                {{ client.totalRevenue | currency: "ZAR" : "R" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ClientDetailComponent implements OnInit {
  private readonly svc = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  client: Client | null = null;

  ngOnInit(): void {
    this.svc
      .getById(this.route.snapshot.paramMap.get("id")!)
      .subscribe((c) => (this.client = c));
  }

  deleteClient(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Client",
          message: `Are you sure you want to delete ${this.client!.name}? This action cannot be undone.`,
        },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(this.client!.id)),
      )
      .subscribe(() => this.router.navigate(["/clients"]));
  }
}
