import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-stat-card",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  @Input() label = "";
  @Input() value = "";
  @Input() icon = "info";
  @Input() iconColor = "#0052cb";
  @Input() iconBg = "#e8f0fe";
  @Input() change?: number | null;
  @Input() changeLabel?: string;
  @Input() subtitle?: string;
}
