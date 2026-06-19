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
  templateUrl: './client-detail.component.html',
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
