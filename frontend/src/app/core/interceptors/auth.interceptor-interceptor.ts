import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/authservice/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  let token: string | null = null;

  if (isPlatformBrowser(platformId)) {
    token = authService.getToken();
  }

  // Clone and modify the request
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedReq); // ← Pass the CLONED request, not the original
  }

  return next(req); // ← If no token, pass original request
};
