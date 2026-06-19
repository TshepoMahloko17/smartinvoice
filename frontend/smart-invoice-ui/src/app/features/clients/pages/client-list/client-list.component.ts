import { Component, OnInit, inject, signal } from "@angular/core";
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
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private readonly svc = inject(ClientService);
  readonly result = signal<PagedResult<Client> | null>(null);
  readonly search = signal("");

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc
      .getClients(1, 20, this.search())
      .subscribe((r) => this.result.set(r));
  }
}
