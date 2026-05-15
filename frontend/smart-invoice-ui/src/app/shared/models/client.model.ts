export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  totalInvoices: number;
  totalRevenue: number;
  createdAt: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}
