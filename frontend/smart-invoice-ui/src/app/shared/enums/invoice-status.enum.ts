export enum InvoiceStatus {
  Draft = 0,
  Pending = 1,
  Paid = 2,
  Overdue = 3,
  Cancelled = 4,
  PartiallyPaid = 5,
}

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: "Draft",
  [InvoiceStatus.Pending]: "Pending",
  [InvoiceStatus.Paid]: "Paid",
  [InvoiceStatus.Overdue]: "Overdue",
  [InvoiceStatus.Cancelled]: "Cancelled",
  [InvoiceStatus.PartiallyPaid]: "Partially Paid",
};
