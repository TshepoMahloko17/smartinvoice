import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import {
  DashboardStats,
  RevenueChart,
} from "../../../shared/models/dashboard-stats.model";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/stats`);
  }

  getRevenueChart(range: string = "6M"): Observable<RevenueChart> {
    const params = new HttpParams().set("range", range);
    return this.http.get<RevenueChart>(`${this.base}/revenue-chart`, {
      params,
    });
  }
}
