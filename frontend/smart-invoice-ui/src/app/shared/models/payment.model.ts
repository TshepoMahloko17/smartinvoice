export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paidOn: string;
  method?: string;
  reference?: string;
  createdAt: string;
}
