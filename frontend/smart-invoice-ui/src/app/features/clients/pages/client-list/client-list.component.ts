import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ClientService } from "../../services/client.service";
import { Client } from "../../../../shared/models/client.model";
import { PagedResult } from "../../../../shared/models/api-response.model";

@Component({
  selector: "app-client-list",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Clients</h2>
        <a
          mat-flat-button
          color="primary"
          routerLink="/clients/new"
        >
          <mat-icon>add</mat-icon> Add Client
        </a>
      </div>

      <div class="card p-4">
        <mat-form-field
          appearance="outline"
          class="w-full max-w-sm"
        >
          <mat-label>Search</mat-label>
          <input
            matInput
            [(ngModel)]="search"
            (ngModelChange)="load()"
            placeholder="Name, email…"
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (client of result?.items; track client.id) {
          <div class="card p-5 space-y-2">
            <div class="flex items-center justify-between">
              <div
                class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0052cb] font-semibold text-sm"
              >
                {{ client.name[0].toUpperCase() }}
              </div>
              <a
                mat-icon-button
                [routerLink]="['/clients', client.id]"
              >
                <mat-icon class="text-gray-400">chevron_right</mat-icon>
              </a>
            </div>
            <p class="font-medium text-gray-900">{{ client.name }}</p>
            <p class="text-sm text-gray-500">{{ client.email }}</p>
            @if (client.companyName) {
              <p class="text-xs text-gray-400">{{ client.companyName }}</p>
            }
            <div
              class="flex gap-4 pt-1 text-xs text-gray-500 border-t border-gray-50"
            >
              <span>{{ client.totalInvoices }} invoices</span>
              <span>{{ client.totalRevenue | currency: "ZAR" : "R" }}</span>
            </div>
          </div>
        } @empty {
          <p class="col-span-3 text-center py-12 text-gray-400">
            No clients yet.
          </p>
        }
      </div>
    </div>
  `,
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientService);
  result: PagedResult<Client> | null = null;
  search = "";

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.getClients(1, 20, this.search).subscribe((r) => (this.result = r));
  }
}
