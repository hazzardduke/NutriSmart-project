import { Injectable, NgZone } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginRedirectGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private zone: NgZone
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.userProfile$.pipe(
      take(1),
      map(user => {
        if (user) {
          const role = (user as any)?.role?.toLowerCase?.() ?? 'cliente';
          const emailVerified = (user as any)?.emailVerified ?? false;

          if (!emailVerified) {
            this.zone.run(() => this.router.navigate(['/auth-verify']));
            return false;
          }

          let target = '/';

          if (role === 'nutricionista') {
            target = '/dashboard-nutricionista';
          } else if (role === 'admin') {
            target = '/admin-clients';
          }

          this.zone.run(() => this.router.navigateByUrl(target));
          return false;
        }

        return true;
      })
    );
  }
}
