import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { StorageService } from "../services/storage.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      // Never try to refresh on auth endpoints — avoids infinite loops
      const isAuthUrl = req.url.includes("/auth/");

      if (error.status === 401 && !isAuthUrl && storage.getRefreshToken()) {
        // Access token expired — attempt a silent refresh
        return auth.refreshToken().pipe(
          switchMap((res) => {
            // Retry the original request with the new access token
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            // Refresh token is also invalid/expired — force logout
            storage.clearTokens();
            router.navigate(["/auth/login"]);
            return throwError(() => refreshError);
          }),
        );
      }

      if (error.status === 401) {
        storage.clearTokens();
        router.navigate(["/auth/login"]);
      }

      return throwError(() => error);
    }),
  );
};
