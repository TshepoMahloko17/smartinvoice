import { Component, OnInit, inject, signal } from "@angular/core";
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
  templateUrl: './contract-list.component.html',
})
export class ContractListComponent implements OnInit {
  private readonly svc = inject(ContractService);
  private readonly dialog = inject(MatDialog);
  readonly result = signal<PagedResult<Contract> | null>(null);

  ngOnInit(): void {
    this.svc.getContracts().subscribe((r) => this.result.set(r));
  }

  delete(id: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete Contract",
          message:
            "Are you sure you want to delete this contract? This action cannot be undone.",
        },
        width: "400px",
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.svc.delete(id)),
      )
      .subscribe(() => {
        const cur = this.result();
        if (cur)
          this.result.set({
            ...cur,
            items: cur.items.filter((c) => c.id !== id),
          });
      });
  }
}
