import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, sendEmailVerification, signOut } from '@angular/fire/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verify-email-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email-request.component.html',
  styleUrls: ['./verify-email-request.component.scss']
})
export class VerifyEmailRequestComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  loading = signal(false);
  email = signal<string | null>(null);
  message = signal('');
  error = signal('');
  verified = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      if (!user) {
        this.router.navigateByUrl('/login');
        return;
      }

      this.email.set(user.email);
      this.verified.set(user.emailVerified);


      if (user.emailVerified) {
        Swal.fire({
          icon: 'success',
          title: 'Correo verificado correctamente',
          html: `
            <p>Tu cuenta ha sido confirmada exitosamente.</p>
            <p>Ahora podés iniciar sesión en tu cuenta NutriSmart.</p>
          `,
          confirmButtonColor: '#a1c037',
          timer: 8000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center'
        });

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 8000);
      }
    });
  }

  async resend() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.message.set('');
    this.error.set('');
    this.loading.set(true);

    try {
      await sendEmailVerification(user, {
        url: 'https://www.nutritiontogocr.com/login'
      });

      Swal.fire({
        icon: 'success',
        title: 'Correo reenviado',
        html: `
          <p>Hemos enviado un nuevo correo de verificación a <b>${user.email}</b>.</p>
          <p>Por favor revisá tu bandeja de entrada o carpeta de spam.</p>
        `,
        confirmButtonColor: '#a1c037',
        timer: 6000,
        timerProgressBar: true,
        showConfirmButton: false
      });

      this.message.set('Correo de verificación reenviado.');
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo reenviar el correo. Intentalo más tarde.',
        confirmButtonColor: '#d9534f',
        timer: 6000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      this.error.set('No se pudo reenviar el correo. Intenta más tarde.');
    } finally {
      this.loading.set(false);
    }
  }

  async goToLogin() {
    await signOut(this.auth);
    this.router.navigateByUrl('/login');
  }
}
