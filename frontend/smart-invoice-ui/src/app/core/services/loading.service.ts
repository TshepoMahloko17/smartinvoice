import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { delay } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private _active = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.pipe(delay(0));

  show(): void {
    this._active++;
    this._loading$.next(true);
  }

  hide(): void {
    this._active = Math.max(0, this._active - 1);
    if (this._active === 0) this._loading$.next(false);
  }
}
