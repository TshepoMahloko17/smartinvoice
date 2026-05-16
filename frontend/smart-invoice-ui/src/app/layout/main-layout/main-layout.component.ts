import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { LoadingSpinnerComponent } from "../../shared/components/loading-spinner/loading-spinner.component";
import { LoadingService } from "../../core/services/loading.service";

@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="min-h-screen">
      <app-sidebar />
      <div class="ml-64 min-h-screen flex flex-col">
        <app-navbar />
        <main class="p-8 pt-20">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-loading-spinner [visible]="loading.loading()" />
  `,
})
export class MainLayoutComponent {
  readonly loading = inject(LoadingService);
}
