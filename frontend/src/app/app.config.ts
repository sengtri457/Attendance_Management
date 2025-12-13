import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import {
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { errorInterceptorInterceptor } from "./core/interceptors/error.interceptor-interceptor";
import { authInterceptorInterceptor } from "./core/interceptors/auth.interceptor-interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        errorInterceptorInterceptor,
        authInterceptorInterceptor,
      ]),
    ),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
