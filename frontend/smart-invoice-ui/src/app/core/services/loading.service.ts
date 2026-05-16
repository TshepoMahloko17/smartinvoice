import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private _active = 0;
  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  show(): void {
    this._active++;
    this._loading.set(true);
  }

  hide(): void {
    this._active = Math.max(0, this._active - 1);
    if (this._active === 0) this._loading.set(false);
  }
}
