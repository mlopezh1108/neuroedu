import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        // No está logueado en Firebase
        router.navigate(['/']);
        return of(false);
      }

      // Si está logueado, verificar autorización en lista blanca
      return authService.checkAuthorization(user.email || '').then(isAuthorized => {
        if (isAuthorized) {
          return true;
        } else {
          // Logueado pero NO autorizado (lista blanca)
          authService.logout();
          router.navigate(['/'], { queryParams: { error: 'unauthorized' } });
          return false;
        }
      });
    })
  );
};
