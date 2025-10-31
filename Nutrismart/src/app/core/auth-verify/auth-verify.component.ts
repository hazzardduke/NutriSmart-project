import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService, NewUserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-auth-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-verify.component.html',
  styleUrls: ['./auth-verify.component.scss']
})
export class AuthVerifyComponent implements OnInit, OnDestroy {
  code = '';
  email = '';
  resendDisabled = false;
  countdown = 0;
  countdownDisplay = '';
  private timerInterval: any;

  private readonly RESEND_KEY = '2faResendAvailableAt';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('2faEmail') || '';
    if (!this.email) {
      this.router.navigate(['/login']);
      return;
    }


    const storedTime = localStorage.getItem(this.RESEND_KEY);
    if (storedTime) {
      const availableAt = parseInt(storedTime, 10);
      const now = Date.now();
      const diffSeconds = Math.floor((availableAt - now) / 1000);
      if (diffSeconds > 0) {
        this.startCountdown(diffSeconds);
      } else {
        localStorage.removeItem(this.RESEND_KEY);
      }
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  async verify(): Promise<void> {
    if (!this.code.trim()) {
      Swal.fire('Atención', 'Debes ingresar el código.', 'warning');
      return;
    }

    try {
      const ok = await this.auth.verifyTwoFactorCode(this.email, this.code);
      if (!ok) {
        Swal.fire('Error', 'Código inválido o expirado.', 'error');
        return;
      }

      localStorage.setItem('2faVerified', 'true');
      localStorage.removeItem('2faEmail');
      localStorage.removeItem(this.RESEND_KEY);

      Swal.fire({
        icon: 'success',
        title: 'Verificación exitosa',
        showConfirmButton: false,
        timer: 1000
      });

      const profile: NewUserProfile = await this.auth.getUserProfileByEmail(this.email);

      setTimeout(() => {
        if (profile.role === 'admin') {
          this.router.navigate(['/admin-clients']);
        } else if (profile.role === 'nutricionista') {
          this.router.navigate(['/dashboard-nutricionista']);
        } else {
          this.router.navigate(['/']);
        }
      }, 1000);
    } catch {
      Swal.fire('Error', 'No se pudo verificar el código.', 'error');
    }
  }

  async resend(): Promise<void> {
    if (this.resendDisabled) return;

    try {
      await this.auth.sendTwoFactorCode(this.email);
      Swal.fire({
        icon: 'success',
        title: 'Código reenviado',
        text: 'Revisa tu correo nuevamente.',
        confirmButtonColor: '#a1c037'
      });

      const availableAt = Date.now() + 300000;
      localStorage.setItem(this.RESEND_KEY, availableAt.toString());
      this.startCountdown(300);
    } catch {
      Swal.fire('Error', 'No se pudo reenviar el código.', 'error');
    }
  }

  private startCountdown(seconds: number): void {
    clearInterval(this.timerInterval);
    this.resendDisabled = true;
    this.countdown = seconds;
    this.updateCountdownDisplay();

    this.timerInterval = setInterval(() => {
      this.countdown--;
      this.updateCountdownDisplay();

      if (this.countdown <= 0) {
        clearInterval(this.timerInterval);
        this.resendDisabled = false;
        this.countdownDisplay = '';
        localStorage.removeItem(this.RESEND_KEY);
      }
    }, 1000);
  }

  private updateCountdownDisplay(): void {
    const minutes = Math.floor(this.countdown / 60);
    const secs = this.countdown % 60;
    this.countdownDisplay = `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  cancel(): void {
    this.auth.logout();
    localStorage.removeItem('2faEmail');
    localStorage.removeItem('2faVerified');
    localStorage.removeItem(this.RESEND_KEY);
    this.router.navigate(['/login']);
  }
}
