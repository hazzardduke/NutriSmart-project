import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService, NewUserProfile } from '../../services/auth.service';
import type { FirebaseError } from 'firebase/app';

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
  private sub: Subscription = new Subscription();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub.add(
      this.auth.isAuthenticated$.subscribe(
        logged => (this.isAuthenticated = logged)
      )
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

    Swal.close();


    Swal.fire({
      title: 'Iniciando sesión...',
      html: `
        <img src="/assets/images/logontg.png" alt="NutriSmart" style="width:120px; margin-bottom:10px;">
        <p>Por favor espera unos segundos</p>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#ffffff',
      didOpen: () => Swal.showLoading()
    });

    try {
      const profile: NewUserProfile = await this.auth.getUserProfileByEmail(this.form.correo);
      await this.auth.login(this.form.correo, this.form.password);
      await firstValueFrom(this.auth.isAuthenticated$);


      if (profile.role === 'admin') {
        await this.auth.sendTwoFactorCode(this.form.correo);
        localStorage.setItem('2faEmail', this.form.correo);

        setTimeout(() => {
          Swal.close();
          this.router.navigateByUrl('/auth-verify', { replaceUrl: true });
        }, 800);
        return;
      }


      const redirectMap: Record<string, string> = {
        nutricionista: '/dashboard-nutricionista',
        cliente: '/',
      };

      setTimeout(() => {
        Swal.close();
        this.router.navigateByUrl(redirectMap[profile.role] || '/', { replaceUrl: true });
      }, 800);

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
    this.auth.logout().then(() => this.router.navigateByUrl('/login'));
  }
}
