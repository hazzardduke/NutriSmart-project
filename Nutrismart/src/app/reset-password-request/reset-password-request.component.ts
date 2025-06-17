import { Component }            from '@angular/core';
import { CommonModule }         from '@angular/common';
import { FormsModule, NgForm }  from '@angular/forms';
import { Router, RouterLink }   from '@angular/router';
import type { FirebaseError }   from 'firebase/app';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password-request.component.html',
  styleUrls: ['./reset-password-request.component.scss']
})
export class ResetPasswordRequestComponent {
  email = '';
  message = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  sendRequest(form: NgForm): void {
  
    if (form.invalid) {
      this.error = 'Por favor ingresa un correo con formato válido.';
      this.message = '';
      return;
    }
  
    this.error = '';
    this.message = '';

    
    this.auth.sendPasswordReset(this.email)
      .then(() => {
        
        this.message = 'Revisa tu correo para restablecer tu contraseña.';
        setTimeout(() => this.router.navigateByUrl('/login'), 3000);
      })
      .catch((err: unknown) => {
        const fbErr = err as FirebaseError;

        switch (fbErr.code) {
          case 'auth/invalid-email':
            this.error = 'Formato de correo inválido.';
            break;

          case 'auth/user-not-found':
            this.error = 'El correo no está registrado.';
            break;

          default:
            this.error = 'No se pudo enviar el correo. Intenta más tarde.';
        }
      });
  }

  clearFeedback(): void {
    this.error = '';
    this.message = '';
  }
}
