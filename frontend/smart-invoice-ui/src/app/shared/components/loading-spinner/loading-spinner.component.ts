import { Component, Input } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
})
export class LoadingSpinnerComponent {
  @Input() visible = false;
}
