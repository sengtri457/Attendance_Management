import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core/primitives/di";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
export const errorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem("tokens");
        localStorage.removeItem("currentUsers");
        router.navigate(["/auth/login"]);
      }
      return throwError(() => error);
    }),
  );
};
