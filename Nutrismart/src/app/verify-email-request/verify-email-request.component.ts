// src/app/core/login/verify-email-request.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-verify-email-request',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email-request.component.html',
  styleUrls: ['./verify-email-request.component.scss']
})
export class VerifyEmailRequestComponent {
  message = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  resend(): void {
    this.message = '';
    this.error = '';
    this.auth.resendEmailVerification()
      .then(() => {
        this.message = 'Correo de verificación reenviado. Revisa tu bandeja de entrada.';
      })
      .catch(() => {
        this.error = 'No se pudo reenviar el correo. Intenta más tarde.';
      });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
