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
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  readonly loading = inject(LoadingService);
}
