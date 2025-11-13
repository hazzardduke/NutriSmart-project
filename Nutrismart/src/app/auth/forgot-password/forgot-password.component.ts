import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  email = '';
  loading = false;

  async onSubmit() {
    if (!this.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Por favor ingresá tu correo electrónico.',
        confirmButtonColor: '#a1c037'
      });
      return;
    }

    this.loading = true;

    try {

      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('correo', '==', this.email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {

        Swal.fire({
          icon: 'error',
          title: 'Correo no encontrado',
          text: 'No existe una cuenta asociada a este correo electrónico.',
          confirmButtonColor: '#d9534f'
        });
        return;
      }


      const actionCodeSettings = {
        url: 'https://www.nutritiontogocr.com/__/auth/action',
        handleCodeInApp: true
      };

      await sendPasswordResetEmail(this.auth, this.email, actionCodeSettings);

      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        html: `
          <p>Hemos enviado un enlace a <b>${this.email}</b> para restablecer tu contraseña.</p>
          <p>Si no lo ves, revisá tu bandeja de spam.</p>
        `,
        confirmButtonColor: '#a1c037'
      }).then(() => {
        this.router.navigateByUrl('/login');
      });

      this.email = '';
    } catch (err: any) {
      console.error(err);
      let msg = 'No se pudo enviar el correo.';
      if (err?.code === 'auth/invalid-email') msg = 'El formato del correo no es válido.';
      if (err?.code === 'auth/user-not-found') msg = 'No existe una cuenta con ese correo.';

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#d9534f'
      });
    } finally {
      this.loading = false;
    }
  }

  volverAlLogin() {
    this.router.navigateByUrl('/login');
  }
}
