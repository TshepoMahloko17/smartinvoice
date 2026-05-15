import { Component, Input } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (visible) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      >
        <mat-progress-spinner
          mode="indeterminate"
          diameter="48"
        />
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  @Input() visible = false;
}
