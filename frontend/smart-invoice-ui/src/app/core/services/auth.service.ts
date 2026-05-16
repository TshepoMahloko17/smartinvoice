import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { StorageService } from "./storage.service";
import { AuthResponse, AuthUser } from "../../shared/models/user.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(
    this.storage.getUser<AuthUser>(),
  );

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.storage.setTokens(res.accessToken, res.refreshToken);
          this.storage.setUser(res.user);
          this.currentUser.set(res.user);
        }),
      );
  }

  logout(): void {
    this.storage.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(["/auth/login"]);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storage.getRefreshToken()!;
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((res) => {
          this.storage.setTokens(res.accessToken, res.refreshToken);
          this.currentUser.set(res.user);
        }),
      );
  }

  register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.storage.setTokens(res.accessToken, res.refreshToken);
          this.storage.setUser(res.user);
          this.currentUser.set(res.user);
        }),
      );
  }

  get isLoggedIn(): boolean {
    return !!this.storage.getAccessToken();
  }
}
