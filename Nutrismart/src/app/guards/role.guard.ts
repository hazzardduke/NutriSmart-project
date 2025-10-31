import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ProfileService, UserProfileData } from '../services/profile.service';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const profile = inject(ProfileService);
  const router = inject(Router);
  const expectedRole = route.data['role'] as 'cliente' | 'admin' | 'nutricionista';

  return auth.user$.pipe(
    take(1),
    switchMap(user => {
      if (!user) return of(router.parseUrl('/login'));
      return profile.getProfile(user.uid).pipe(
        take(1),
        map((p: UserProfileData) => {
          const verified2FA = localStorage.getItem('2faVerified') === 'true';
          if (p.role === 'admin' && !verified2FA) {
            return router.parseUrl('/auth-verify');
          }
          return p.role === expectedRole ? true : router.parseUrl('/');
        })
      );
    })
  );
};
