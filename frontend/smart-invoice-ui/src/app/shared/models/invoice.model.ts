import { InvoiceStatus } from "../enums/invoice-status.enum";
import { Currency } from "../enums/currency.enum";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  notes?: string;
  currency: Currency;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateInvoiceRequest {
  clientId: string;
  issuedDate: string;
  dueDate: string;
  currency: Currency;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
}

export type UpdateInvoiceRequest = CreateInvoiceRequest;
