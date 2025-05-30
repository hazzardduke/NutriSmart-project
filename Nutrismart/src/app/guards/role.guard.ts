// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'] as string;

  return auth.idTokenResult$.pipe(
    map(tokenResult => {
        const actualRole = tokenResult?.claims?.['role'] as string|undefined;
      return actualRole === expectedRole
        ? true
        : router.parseUrl('/login');
    })
  );
};
