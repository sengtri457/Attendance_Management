import { inject } from "@angular/core/primitives/di";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../services/authservice/auth.service";

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(["/auth/login"]);
  return false;
};
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.hasRole(allowedRoles)) {
      return true;
    }

    router.navigate(["/dashboard"]);
    return false;
  };
};
