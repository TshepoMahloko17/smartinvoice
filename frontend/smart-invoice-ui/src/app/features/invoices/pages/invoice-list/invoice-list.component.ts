import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { InvoiceService, InvoiceQuery } from "../../services/invoice.service";
import { StatusBadgeComponent } from "../../../../shared/components/status-badge/status-badge.component";
import { Invoice } from "../../../../shared/models/invoice.model";
import { InvoiceStatus } from "../../../../shared/enums/invoice-status.enum";
import { PagedResult } from "../../../../shared/models/api-response.model";

@Component({
  selector: "app-invoice-list",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    StatusBadgeComponent,
  ],
  templateUrl: './invoice-list.component.html',
})
export class InvoiceListComponent implements OnInit {
  private readonly svc = inject(InvoiceService);

  readonly InvoiceStatus = InvoiceStatus;
  readonly result = signal<PagedResult<Invoice> | null>(null);
  readonly page = signal(1);
  readonly search = signal("");
  readonly statusFilter = signal<InvoiceStatus | null>(null);
  readonly downloadingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onFilter(): void {
    this.page.set(1);
    this.load();
  }
  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  downloadPdf(id: string, invoiceNumber: string): void {
    this.downloadingId.set(id);
    this.svc.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => {
        this.downloadingId.set(null);
      },
    });
  }

  private load(): void {
    const q: InvoiceQuery = { page: this.page(), pageSize: 10 };
    if (this.search()) q.search = this.search();
    if (this.statusFilter() != null) q.status = this.statusFilter()!;
    this.svc.getInvoices(q).subscribe((r) => this.result.set(r));
  }
}
