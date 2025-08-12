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
      let email = window.localStorage.getItem('emailForSignIn') || '';
      if (!email) {
        email = prompt('Introduce tu correo para completar el link:') || '';
      }
      this.auth.completeSignInWithLink(email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          // Forzar recarga para inicializar la app ya autentificada
          window.location.href = '/admin-clients';
        })
        .catch((e: any) => this.error = e.message);
      return;
    }

    // 2) Observamos el estado de autenticación para mostrar el formulario
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
      // Obtenemos el perfil (incluye el role)
      const profile: NewUserProfile =
        await this.auth.getUserProfileByEmail(this.form.correo);

      if (profile.role === 'admin') {
        // Magic link para admin
        window.localStorage.setItem('emailForSignIn', this.form.correo);
        await this.auth.sendSignInLink(this.form.correo);
        this.infoMessage = 'Eres admin: revisa tu correo para el enlace mágico.';
        return;
      }

      // Login normal (cliente o nutricionista)
      await this.auth.login(this.form.correo, this.form.password);

      // Redirigimos según el rol
      if (profile.role === 'nutricionista') {
        this.router.navigate(['/dashboard-nutricionista']);
      } else {
        // cliente
        this.router.navigate(['/']);
      }
    } catch (err: any) {
      const code = (err as FirebaseError).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
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
}
