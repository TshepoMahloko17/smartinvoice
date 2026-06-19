import {
  Component,
  OnInit,
  HostListener,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { AuthService } from "../../core/services/auth.service";
import { ThemeService } from "../../core/services/theme.service";
import { DashboardService } from "../../features/dashboard/services/dashboard.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly router = inject(Router);
  private readonly dashboardSvc = inject(DashboardService);

  readonly pendingCount = signal(0);
  readonly showNotif = signal(false);
  readonly hovering = signal(false);
  readonly hoveringFooter = signal(false);

  readonly initials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return "U";
    return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
  });

  ngOnInit(): void {
    this.dashboardSvc
      .getStats()
      .subscribe((s) => this.pendingCount.set(s.pendingInvoicesCount));
    // set initial header height CSS variable
    this.updateHeaderHeight();

    // close sidebar on successful navigation (ensures mobile sidebar always closes)
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        try {
          document.body.classList.remove("sidebar-open");
          (document.activeElement as HTMLElement | null)?.blur();
        } catch {}
        this.removeSidebarKeyHandler();
      }
    });
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.updateHeaderHeight();
  }

  private updateHeaderHeight(): void {
    try {
      const header = document.querySelector("header") as HTMLElement | null;
      if (!header) return;
      const h = header.offsetHeight;
      document.documentElement.style.setProperty(
        "--si-header-height",
        `${h}px`,
      );
    } catch (e) {
      // ignore in non-DOM environments
    }
  }

  // handler reference used to remove listener when sidebar closes
  private _sidebarKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  toggleSidebar(): void {
    try {
      const opened = document.body.classList.toggle("sidebar-open");
      const aside = document.querySelector(
        "aside.sidebar",
      ) as HTMLElement | null;
      if (opened) {
        // focus first link inside sidebar for accessibility
        const first = aside?.querySelector("a, button") as HTMLElement | null;
        first?.focus();

        // install key handler to trap focus and handle Escape
        this._sidebarKeyHandler = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            document.body.classList.remove("sidebar-open");
            (document.activeElement as HTMLElement | null)?.blur();
            this.removeSidebarKeyHandler();
            return;
          }
          if (e.key === "Tab") {
            // simple focus trap within aside
            const focusable = aside
              ? Array.from(
                  aside.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
                  ),
                ).filter((el) => !el.hasAttribute("disabled"))
              : [];
            if (focusable.length === 0) return;
            const firstEl = focusable[0];
            const lastEl = focusable[focusable.length - 1];
            if (!e.shiftKey && document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            } else if (e.shiftKey && document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          }
        };
        document.addEventListener(
          "keydown",
          this._sidebarKeyHandler as EventListener,
        );
        // expose handler so other components (sidebar close) can remove it
        try {
          (window as any).__smartinvoice_sidebar_key_handler =
            this._sidebarKeyHandler;
        } catch {}
      } else {
        this.removeSidebarKeyHandler();
      }
    } catch (e) {
      // ignore when running in environments without DOM
    }
  }

  private removeSidebarKeyHandler(): void {
    if (this._sidebarKeyHandler) {
      document.removeEventListener(
        "keydown",
        this._sidebarKeyHandler as EventListener,
      );
      this._sidebarKeyHandler = null;
      try {
        delete (window as any).__smartinvoice_sidebar_key_handler;
      } catch {}
    }
  }

  toggleNotif(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotif.update((v) => !v);
  }

  @HostListener("document:click")
  onDocumentClick(): void {
    this.showNotif.set(false);
  }

  goToPending(): void {
    this.showNotif.set(false);
    this.router.navigate(["/invoices"], { queryParams: { status: 1 } });
  }

  goToInvoices(): void {
    this.showNotif.set(false);
    this.router.navigate(["/invoices"]);
  }
}
