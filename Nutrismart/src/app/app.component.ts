import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { HeaderComponent } from './core/header/header.component';
import { VerifyEmailRequestComponent } from './auth/verify-email-request/verify-email-request.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    VerifyEmailRequestComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isVerified = false;
  isSimpleRoute = false;
  sidebarActive = false;
  private sub = new Subscription();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.showInitialSplash();
    this.sub.add(this.auth.isAuthenticated$.subscribe(v => this.isAuthenticated = v));
    this.sub.add(this.auth.user$.subscribe(u => this.isVerified = !!u && u.emailVerified));
    setTimeout(() => this.updateSimpleRoute(this.router.url), 0);
    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(e => {
          this.updateSimpleRoute(e.urlAfterRedirects);
          this.closeSidebarOnMobile();
        })
    );
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
      if (this.isAuthenticated) {
        window.history.pushState(null, '', window.location.href);
      }
    });
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      this.sidebarActive = false;
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.menu-toggle');
    if (
      this.sidebarActive &&
      sidebar &&
      !sidebar.contains(event.target as Node) &&
      !toggleBtn?.contains(event.target as Node)
    ) {
      this.sidebarActive = false;
    }
  }

  updateSimpleRoute(url: string) {
    const simpleRoutes = [
      '/login',
      '/register',
      '/reset-password',
      '/auth-verify',
      '/forgot-password',
      '/two-factor'
    ];
    this.isSimpleRoute = simpleRoutes.some(r => url.startsWith(r));
  }

  showInitialSplash(): void {
    Swal.fire({
      title: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <img src="assets/images/logontg.png" alt="NutriSmart" style="width:130px;height:auto;margin-bottom:15px;">
          <h3 style="color:#1f3a52;font-family:'Poppins',sans-serif;">Cargando NutriSmart...</h3>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => Swal.close(), 600);
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
