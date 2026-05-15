import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
} from "../../../shared/models/invoice.model";
import { PagedResult } from "../../../shared/models/api-response.model";
import { InvoiceStatus } from "../../../shared/enums/invoice-status.enum";

export interface InvoiceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InvoiceStatus;
}

@Injectable({ providedIn: "root" })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invoices`;

  getInvoices(query: InvoiceQuery = {}): Observable<PagedResult<Invoice>> {
    let params = new HttpParams()
      .set("page", query.page ?? 1)
      .set("pageSize", query.pageSize ?? 10);
    if (query.search) params = params.set("search", query.search);
    if (query.status != null) params = params.set("status", query.status);
    return this.http.get<PagedResult<Invoice>>(this.base, { params });
  }

  getById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/${id}`);
  }

  create(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(this.base, request);
  }

  update(id: string, request: UpdateInvoiceRequest): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.base}/${id}`, request);
  }

  updateStatus(id: string, status: InvoiceStatus): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, { status });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/download-pdf`, {
      responseType: "blob",
    });
  }
}
