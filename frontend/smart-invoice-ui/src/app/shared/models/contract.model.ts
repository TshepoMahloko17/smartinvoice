export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  isSigned: boolean;
  linkedInvoiceId?: string;
  createdAt: string;
}
