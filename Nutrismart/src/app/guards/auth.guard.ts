// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { first, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    // Espera la primera emisión (usuario u null)
    first(),
    // Si hay usuario, permite; si no, redirige a /login
    map(u => u
      ? true
      : router.parseUrl('/login')
    )
  );
};
