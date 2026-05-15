import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Payment } from "../../../shared/models/payment.model";
import { PagedResult } from "../../../shared/models/api-response.model";

@Injectable({ providedIn: "root" })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payments`;

  getPayments(page = 1, pageSize = 20): Observable<PagedResult<Payment>> {
    const params = new HttpParams().set("page", page).set("pageSize", pageSize);
    return this.http.get<PagedResult<Payment>>(this.base, { params });
  }

  record(
    invoiceId: string,
    amount: number,
    method?: string,
    reference?: string,
  ): Observable<Payment> {
    return this.http.post<Payment>(this.base, {
      invoiceId,
      amount,
      paidOn: new Date().toISOString(),
      method,
      reference,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
