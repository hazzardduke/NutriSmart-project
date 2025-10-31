import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const twoFactorGuard: CanActivateFn = () => {
  const router = inject(Router);


  const email = localStorage.getItem('2faEmail');
  const verified = localStorage.getItem('2faVerified') === 'true';


  if (!email || verified) {
    return router.parseUrl('/login');
  }


  return true;
};
