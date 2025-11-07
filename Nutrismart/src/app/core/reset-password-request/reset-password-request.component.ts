import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import Swal from 'sweetalert2';
import type { FirebaseError } from 'firebase/app';

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
    private router: Router,
    private firestore: Firestore
  ) {}

  async sendRequest(form: NgForm): Promise<void> {
    this.message = '';
    this.error = '';

    if (form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor ingresa un correo con formato válido.',
        confirmButtonColor: '#a1c037'
      });
      return;
    }

    try {

      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('correo', '==', this.email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Swal.fire({
          icon: 'error',
          title: 'Correo no encontrado',
          text: 'No existe una cuenta registrada con este correo electrónico.',
          confirmButtonColor: '#ff6600'
        });
        return;
      }


      await this.auth.sendPasswordReset(this.email);

      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        confirmButtonColor: '#a1c037'
      });

      setTimeout(() => this.router.navigateByUrl('/login'), 3000);
    } catch (err) {
      const fbErr = err as FirebaseError;
      console.error('Error al enviar solicitud:', fbErr);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          fbErr.code === 'auth/invalid-email'
            ? 'Formato de correo inválido.'
            : 'No se pudo enviar el correo. Intenta más tarde.',
        confirmButtonColor: '#ff6600'
      });
    }
  }

  clearFeedback(): void {
    this.error = '';
    this.message = '';
  }
}
