import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { StorageService } from "../services/storage.service";

function getErrorMessage(status: number, error: unknown): string {
  const body = error as { message?: string; errors?: Record<string, string[]> };
  switch (status) {
    case 400:
      return body?.message ?? "Invalid request — please check your input.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 422: {
      const first = body?.errors
        ? Object.values(body.errors).flat()[0]
        : undefined;
      return (
        first ?? body?.message ?? "Validation failed — please check your input."
      );
    }
    case 429:
      return "Too many requests — please wait a moment and try again.";
    case 0:
      return "Unable to connect — check your internet connection.";
    default:
      return status >= 500
        ? "Something went wrong on the server. Please try again."
        : "An unexpected error occurred.";
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

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
        return throwError(() => error);
      }

      // Show a snackbar for all other errors
      snackBar.open(getErrorMessage(error.status, error.error), "Dismiss", {
        duration: 5000,
        panelClass: ["snackbar-error"],
        horizontalPosition: "right",
        verticalPosition: "bottom",
      });

      return throwError(() => error);
    }),
  );
};
