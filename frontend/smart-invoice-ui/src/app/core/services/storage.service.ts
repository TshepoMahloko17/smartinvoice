import { Injectable } from "@angular/core";

const TOKEN_KEY = "si_access_token";
const REFRESH_KEY = "si_refresh_token";
const USER_KEY = "si_user";

// sessionStorage is used intentionally: tokens are cleared automatically when
// the tab or window closes, limiting the exposure window compared to
// localStorage. An httpOnly cookie strategy would be the next hardening step.
@Injectable({ providedIn: "root" })
export class StorageService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  setUser(user: unknown): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  clearTokens(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
