import { Pipe, PipeTransform } from "@angular/core";
import {
  InvoiceStatus,
  InvoiceStatusLabels,
} from "../enums/invoice-status.enum";

@Pipe({ name: "statusLabel", standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: InvoiceStatus): string {
    return InvoiceStatusLabels[status] ?? "Unknown";
  }
}
