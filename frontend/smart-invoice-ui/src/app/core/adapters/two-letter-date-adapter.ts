import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

@Injectable()
export class TwoLetterDateAdapter extends NativeDateAdapter {
  override getDayOfWeekNames(_style: "long" | "short" | "narrow"): string[] {
    return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  }
}
