import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { switchMap, filter } from "rxjs";
import { ContractService } from "../../services/contract.service";
import { Contract } from "../../../../shared/models/contract.model";
import { PagedResult } from "../../../../shared/models/api-response.model";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "app-contract-list",
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Contracts</h2>
        <a
          mat-flat-button
          color="primary"
          routerLink="/contracts/new"
          class="text-sm flex items-center gap-1"
        >
          <mat-icon style="font-size:16px; width:16px; height:16px;"
            >add</mat-icon
          >
          New Contract
        </a>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-gray-500 text-xs uppercase tracking-wide">
              <th class="px-4 py-3 text-left">Title</th>
              <th class="px-4 py-3 text-left">Client</th>
              <th class="px-4 py-3 text-left">Start Date</th>
              <th class="px-4 py-3 text-center">Signed</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (c of result?.items; track c.id) {
              <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">
                  {{ c.title }}
                </td>
                <td class="px-4 py-3 text-gray-500">{{ c.clientName }}</td>
                <td class="px-4 py-3 text-gray-500">
                  {{ c.startDate | date: "mediumDate" }}
                </td>
                <td class="px-4 py-3 text-center">
                  <mat-icon
                    [class]="c.isSigned ? 'text-green-500' : 'text-gray-300'"
                  >
                    {{ c.isSigned ? "check_circle" : "radio_button_unchecked" }}
                  </mat-icon>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    mat-icon-button
                    (click)="delete(c.id)"
                    aria-label="Delete contract"
                  >
                    <mat-icon class="text-red-400">delete</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="5"
                  class="px-4 py-8 text-center text-gray-400"
                >
                  No contracts found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ContractListComponent implements OnInit {
  private readonly svc = inject(ContractService);
  private readonly dialog = inject(MatDialog);
  result: PagedResult<Contract> | null = null;

  ngOnInit(): void {
    this.svc.getContracts().subscribe((r) => (this.result = r));
  }

  delete(id: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: "Delete Contract", message: "Are you sure you want to delete this contract? This action cannot be undone." },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(id)),
      )
      .subscribe(() => {
        if (this.result)
          this.result = {
            ...this.result,
            items: this.result.items.filter((c) => c.id !== id),
          };
      });
  }
}
