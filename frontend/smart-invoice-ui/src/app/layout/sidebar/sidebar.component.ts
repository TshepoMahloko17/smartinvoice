import { Component, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { AuthService } from "../../core/services/auth.service";

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styles: [
    `
      .nav-item {
        color: #475569;
      }
      .nav-item:hover {
        background-color: #f8fafc;
        color: #1e293b;
      }
      .active-nav {
        background-color: #e8f0fe !important;
        border-left: 4px solid #1d6af5;
        color: #1d6af5 !important;
        font-weight: 600;
      }
      .active-nav mat-icon {
        color: #1d6af5 !important;
      }

      :host-context(.dark) .nav-item {
        color: #94a3b8;
      }
      :host-context(.dark) .nav-item:hover {
        background-color: #252840 !important;
        color: #e2e8f0;
      }
      :host-context(.dark) .active-nav {
        background-color: #1e2d4d !important;
      }
    `,
  ],
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  readonly navItems: NavItem[] = [
    { label: "Dashboard", icon: "dashboard", route: "/dashboard" },
    { label: "Invoices", icon: "receipt", route: "/invoices" },
    { label: "Clients", icon: "group", route: "/clients" },
    { label: "Contracts", icon: "description", route: "/contracts" },
    { label: "Payments", icon: "payments", route: "/payments" },
  ];

  readonly initials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return "U";
    return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
  });

  close(): void {
    try {
      document.body.classList.remove("sidebar-open");
      // remove global key handler if present
      try {
        const h = (window as any).__smartinvoice_sidebar_key_handler as
          | EventListener
          | undefined;
        if (h) document.removeEventListener("keydown", h);
        try {
          delete (window as any).__smartinvoice_sidebar_key_handler;
        } catch {}
      } catch {}
    } catch (e) {
      // ignore
    }
  }
}
