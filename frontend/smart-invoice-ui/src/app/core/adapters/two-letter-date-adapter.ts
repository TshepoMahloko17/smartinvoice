import { Injectable } from "@angular/core";
import { MatNativeDateAdapter } from "@angular/material/core";

@Injectable()
export class TwoLetterDateAdapter extends MatNativeDateAdapter {
  override getDayOfWeekNames(
    style: "long" | "short" | "narrow"
  ): string[] {
    if (style === "short" || style === "narrow") {
      return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    }
    return super.getDayOfWeekNames(style);
  }
}
