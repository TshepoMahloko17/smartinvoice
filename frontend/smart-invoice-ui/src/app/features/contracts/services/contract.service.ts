import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Contract } from "../../../shared/models/contract.model";
import { PagedResult } from "../../../shared/models/api-response.model";

@Injectable({ providedIn: "root" })
export class ContractService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contracts`;

  getContracts(page = 1, pageSize = 10): Observable<PagedResult<Contract>> {
    const params = new HttpParams().set("page", page).set("pageSize", pageSize);
    return this.http.get<PagedResult<Contract>>(this.base, { params });
  }

  getById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.base}/${id}`);
  }

  create(request: Partial<Contract>): Observable<Contract> {
    return this.http.post<Contract>(this.base, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  linkToInvoice(id: string, invoiceId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${id}/link-invoice/${invoiceId}`,
      {},
    );
  }
}
