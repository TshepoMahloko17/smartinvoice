import { Component, computed, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  readonly fullName = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return "";
    return `${u.firstName} ${u.lastName}`.trim();
  });

  readonly firstName = computed(() => this.auth.currentUser()?.firstName ?? "");
  readonly lastName = computed(() => this.auth.currentUser()?.lastName ?? "");
  readonly userEmail = computed(() => this.auth.currentUser()?.email ?? "");

  readonly initials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return "U";
    return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
  });

  logout(): void {
    this.auth.logout();
  }
}
