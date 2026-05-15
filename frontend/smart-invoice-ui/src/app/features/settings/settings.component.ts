import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <h2 class="text-xl font-semibold text-gray-900">Account Settings</h2>

      <div class="card p-6 space-y-5">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-[#0052cb] flex items-center justify-center text-white text-2xl font-semibold"
          >
            {{ initials }}
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-900">{{ fullName }}</p>
            <p class="text-sm text-gray-500">{{ userEmail }}</p>
          </div>
        </div>

        <hr class="border-gray-100" />

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p
              class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"
            >
              First Name
            </p>
            <p class="text-gray-700">{{ firstName || "�" }}</p>
          </div>
          <div>
            <p
              class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"
            >
              Last Name
            </p>
            <p class="text-gray-700">{{ lastName || "�" }}</p>
          </div>
          <div class="col-span-2">
            <p
              class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"
            >
              Email
            </p>
            <p class="text-gray-700">{{ userEmail || "�" }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Danger Zone</h3>
        <button
          mat-stroked-button
          color="warn"
          (click)="logout()"
        >
          <mat-icon>logout</mat-icon>
          Sign out
        </button>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  get fullName(): string {
    const u = this.auth.currentUser;
    if (!u) return "";
    return `${u.firstName} ${u.lastName}`.trim();
  }

  get firstName(): string {
    return this.auth.currentUser?.firstName ?? "";
  }

  get lastName(): string {
    return this.auth.currentUser?.lastName ?? "";
  }

  get userEmail(): string {
    return this.auth.currentUser?.email ?? "";
  }

  get initials(): string {
    const u = this.auth.currentUser;
    if (!u) return "U";
    return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }
}
