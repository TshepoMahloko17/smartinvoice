import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InvoiceStatus } from "../../enums/invoice-status.enum";
import { StatusLabelPipe } from "../../pipes/status-label.pipe";

@Component({
  selector: "app-status-badge",
  standalone: true,
  imports: [CommonModule, StatusLabelPipe],
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  @Input() status!: InvoiceStatus;

  get cssClass(): string {
    switch (this.status) {
      case InvoiceStatus.Paid:
        return "paid";
      case InvoiceStatus.PartiallyPaid:
        return "partial-paid";
      case InvoiceStatus.Pending:
        return "pending";
      case InvoiceStatus.Overdue:
        return "overdue";
      case InvoiceStatus.Draft:
        return "draft";
      default:
        return "draft";
    }
  }
}
