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
  template: `
    <aside
      class="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg flex flex-col overflow-y-auto z-50"
    >
      <!-- Logo -->
      <div class="px-6 pt-6 pb-8">
        <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase">
          SmartInvoice
        </h1>
        <p class="text-[10px] font-bold text-slate-500 tracking-widest mt-1">
          ENTERPRISE FINANCE
        </p>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 space-y-0.5 px-0">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active-nav"
            class="nav-item flex items-center gap-3 px-6 py-3 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <mat-icon style="font-size:20px; width:20px; height:20px;">{{
              item.icon
            }}</mat-icon>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Bottom section -->
      <div class="mt-auto border-t border-slate-100 pt-2 pb-0 space-y-0.5 px-0">
        <a
          routerLink="/settings"
          routerLinkActive="active-nav"
          class="nav-item flex items-center gap-3 px-6 py-3 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <mat-icon style="font-size:20px; width:20px; height:20px;"
            >settings</mat-icon
          >
          Account Settings
        </a>

        <!-- User card -->
        <div
          class="mx-3 mb-3 mt-1 p-3 bg-slate-50 rounded-xl flex items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          >
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 truncate">
              {{ auth.currentUser()?.firstName }}
              {{ auth.currentUser()?.lastName }}
            </p>
            <p class="text-[11px] text-slate-500 truncate">
              {{ auth.currentUser()?.email }}
            </p>
          </div>
          <button
            class="text-slate-400 hover:text-red-500 transition-colors"
            (click)="auth.logout()"
            title="Logout"
          >
            <mat-icon style="font-size:20px; width:20px; height:20px;"
              >logout</mat-icon
            >
          </button>
        </div>
      </div>
    </aside>
  `,
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
}
