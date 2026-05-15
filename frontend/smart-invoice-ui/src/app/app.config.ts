import { ApplicationConfig, DEFAULT_CURRENCY_CODE } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { loadingInterceptor } from "./core/interceptors/loading.interceptor";
import { TwoLetterDateAdapter } from "./core/adapters/two-letter-date-adapter";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor]),
    ),
    { provide: DEFAULT_CURRENCY_CODE, useValue: "ZAR" },
    provideCharts(withDefaultRegisterables()),
    { provide: DateAdapter, useClass: TwoLetterDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
};
