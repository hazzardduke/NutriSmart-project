// src/app/core/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import type { FirebaseError } from 'firebase/app';
import { AuthService, NewUserProfile } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  form = { correo: '', password: '' };
  error = '';
  infoMessage = '';
  isAuthenticated = false;
  private sub!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isSignInLink(window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn') || '';
      if (!email) {
        email = prompt('Introduce tu correo para completar el link:') || '';
      }
      this.auth.completeSignInWithLink(email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          window.location.href = '/admin-clients';
        })
        .catch((e: any) => this.error = e.message);
      return;
    }

    this.sub = this.auth.isAuthenticated$.subscribe(
      logged => this.isAuthenticated = logged
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async login(loginForm: NgForm): Promise<void> {
    this.error = '';
    this.infoMessage = '';

    if (!loginForm.valid) {
      this.error = 'Completa correo y contraseña.';
      return;
    }


    Swal.fire({
      title: 'Iniciando sesión...',
      html: `
        <img src="/assets/images/logontg.png" alt="NutriSmart" style="width: 150px; margin-bottom: 15px;">
        <br>
        <b>Por favor espera unos segundos</b>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#ffffff',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const profile: NewUserProfile =
        await this.auth.getUserProfileByEmail(this.form.correo);

      if (profile.role === 'admin') {
        await this.auth.sendSignInLink(this.form.correo);
        Swal.close();
        this.infoMessage = 'Eres admin: revisa tu correo para el enlace mágico.';
        return;
      }

      await this.auth.login(this.form.correo, this.form.password);


      Swal.close();

      if (profile.role === 'nutricionista') {
        this.router.navigate(['/dashboard-nutricionista']);
      } else {
        this.router.navigate(['/']);
      }

    } catch (err: any) {
      Swal.close();

      const code = (err as FirebaseError).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        this.error = 'Contraseña o correo incorrectos.';
      } else if (code === 'auth/user-not-found') {
        this.error = 'Usuario no registrado.';
      } else {
        this.error = err.message || 'Error al iniciar sesión.';
      }


      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.error,
        confirmButtonColor: '#a1c037'
      });
    }
  }

  logout(): void {
    this.auth.logout().then(() => {
      this.router.navigateByUrl('/login');
    });
  }
}
