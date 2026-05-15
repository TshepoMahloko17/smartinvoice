import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div
      class="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6"
    >
      <p class="text-8xl font-extrabold text-blue-600 leading-none">404</p>
      <h1 class="mt-4 text-2xl font-semibold text-gray-900">Page not found</h1>
      <p class="mt-2 text-gray-500 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <a
        mat-flat-button
        color="primary"
        routerLink="/"
        class="mt-8"
      >
        <mat-icon>arrow_back</mat-icon> Back to dashboard
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
