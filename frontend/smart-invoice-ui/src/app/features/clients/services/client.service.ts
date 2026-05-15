import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import {
  Client,
  CreateClientRequest,
} from "../../../shared/models/client.model";
import { PagedResult } from "../../../shared/models/api-response.model";

@Injectable({ providedIn: "root" })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clients`;

  getClients(
    page = 1,
    pageSize = 20,
    search = "",
  ): Observable<PagedResult<Client>> {
    let params = new HttpParams().set("page", page).set("pageSize", pageSize);
    if (search) params = params.set("search", search);
    return this.http.get<PagedResult<Client>>(this.base, { params });
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(request: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.base, request);
  }

  update(id: string, request: Partial<CreateClientRequest>): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
