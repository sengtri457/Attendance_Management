import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core/primitives/di";
import { AuthService } from "../../services/authservice/auth.service";

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
