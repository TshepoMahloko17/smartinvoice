import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { StorageService } from "./storage.service";
import { AuthResponse, AuthUser } from "../../shared/models/user.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly _currentUser$ = new BehaviorSubject<AuthUser | null>(
    this.storage.getUser<AuthUser>(),
  );

  readonly currentUser$ = this._currentUser$.asObservable();

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
          this._currentUser$.next(res.user);
        }),
      );
  }

  logout(): void {
    this.storage.clearTokens();
    this._currentUser$.next(null);
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
          this._currentUser$.next(res.user);
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
          this._currentUser$.next(res.user);
        }),
      );
  }

  get currentUser(): AuthUser | null {
    return this._currentUser$.value;
  }

  get isLoggedIn(): boolean {
    return !!this.storage.getAccessToken();
  }
}
