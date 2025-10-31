import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { map, take, first } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    map(user => {

      if (!user) {
        return router.parseUrl('/login');
      }

      if (!user.emailVerified) {
        return router.parseUrl('/verify-email');
      }

      return true;
    })
  );
};
