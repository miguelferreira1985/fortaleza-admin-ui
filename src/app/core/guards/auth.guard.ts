import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isExpired } from '../utils/jwt.util';


export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = authService.getAccessToken();

  if (!token || isExpired(token)) {
    router.navigate(['/login']);
    return false;
  }

    const allowedRoles: string[] = route?.data?.['roles'] ?? [];
    const userRoles = authService.getUserRoles();

  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    if (!hasAccess) {
      console.warn('Acceso denegado. Redirigiendo a /dashboard');
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
