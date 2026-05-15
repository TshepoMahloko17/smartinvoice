import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private _isDark = false;

  constructor() {
    const saved = localStorage.getItem("si-theme");
    if (saved === "dark") {
      this._isDark = true;
      document.documentElement.classList.add("dark");
    }
  }

  get isDark(): boolean {
    return this._isDark;
  }

  toggle(): void {
    this._isDark = !this._isDark;
    document.documentElement.classList.toggle("dark", this._isDark);
    localStorage.setItem("si-theme", this._isDark ? "dark" : "light");
  }
}
