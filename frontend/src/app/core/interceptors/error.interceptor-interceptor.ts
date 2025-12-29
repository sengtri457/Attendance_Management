import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export const errorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (isPlatformBrowser(platformId)) {
          // Make sure these keys match what you're actually using
          localStorage.removeItem('tokens'); // ← Update this
          localStorage.removeItem('currentUsers'); // ← Update this
          // Or clear everything: localStorage.clear();
        }
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
