// src/app/core/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { FormsModule, NgForm }         from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { Subscription }                from 'rxjs';
import type { FirebaseError }          from 'firebase/app';
import { AuthService, NewUserProfile } from '../../services/auth.service';

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
    // 1) Si venimos de un magic link pendiente
    if ( this.auth.isSignInLink(window.location.href) ) {
      let email = window.localStorage.getItem('emailForSignIn')!;
      if (!email) {
        email = prompt('Introduce tu correo para completar el link:')!;
      }
      this.auth.completeSignInWithLink(email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          // forzamos un reload completo para que AuthState esté ya listo
          window.location.href = '/';
        })
        .catch((e: any) => this.error = e.message);
      return; // no queremos seguir mostrando el formulario
    }

    // 2) Sólo observamos authState para ocultar/mostrar el formulario
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

    try {
      // 1) Buscamos perfil en Firestore
      const profile: NewUserProfile = await this.auth.getUserProfileByEmail(this.form.correo);

      if (profile.role === 'admin') {
        // → magic link para admin
        window.localStorage.setItem('emailForSignIn', this.form.correo);
        await this.auth.sendSignInLink(this.form.correo);
        this.infoMessage =
          'Eres administrador: te hemos enviado un enlace mágico a tu correo para iniciar sesión.';
      } else {
        // → login con contraseña para cliente
        await this.auth.login(this.form.correo, this.form.password);
        // forzamos reload al home
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Fallo login:', err);
      const code = (err as FirebaseError).code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        this.error = 'Contraseña o correo incorrectos.';
      } else if (code === 'auth/user-not-found') {
        this.error = 'Usuario no registrado.';
      } else {
        this.error = err.message || 'Error al iniciar sesión.';
      }
    }
  }

  logout(): void {
    this.auth.logout().then(() => {
      this.router.navigateByUrl('/login');
    });
  }

  clearError(): void {
    this.error = '';
    this.infoMessage = '';
  }
}
