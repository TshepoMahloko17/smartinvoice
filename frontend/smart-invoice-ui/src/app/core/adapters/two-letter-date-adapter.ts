import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

@Injectable()
export class TwoLetterDateAdapter extends NativeDateAdapter {
  override getDayOfWeekNames(
    style: "long" | "short" | "narrow"
  ): string[] {
    if (style === "short" || style === "narrow") {
      return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    }
    return super.getDayOfWeekNames(style);
  }
}
