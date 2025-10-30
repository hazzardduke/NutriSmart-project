import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterModule }                  from '@angular/router';
import { Subscription }                  from 'rxjs';
import { AuthService }                   from './services/auth.service';
import { SidebarComponent }              from './core/sidebar/sidebar.component';
import { HeaderComponent }               from './core/header/header.component';
import { VerifyEmailRequestComponent }   from './verify-email-request/verify-email-request.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    VerifyEmailRequestComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isVerified      = false;
  private sub     = new Subscription();

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.showReloadAlert();

    this.sub.add(
      this.auth.isAuthenticated$.subscribe(v => this.isAuthenticated = v)
    );
    this.sub.add(
      this.auth.user$.subscribe(u => this.isVerified = !!u && u.emailVerified)
    );
  }

  showReloadAlert(): void {
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
        setTimeout(() => Swal.close(),500);
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
