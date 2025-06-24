
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    map(user => {
      // si no esta logueado se va al /login (/)
      if (!user) {
        return router.parseUrl('/login');
      }
      // si esta logueado pero no ha verificado el email se va a /verify-email
      if (!user.emailVerified) {
        return router.parseUrl('/verify-email');
      }
      //si está logueado y verificado se permite el acceso
      return true;
    })
  );
};
