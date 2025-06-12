// src/app/core/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { FormsModule, NgForm }          from '@angular/forms';
import { Router, RouterLink }           from '@angular/router';
import { AuthService }                  from '../../services/auth.service';
import { Subscription }                 from 'rxjs';
import type { FirebaseError }           from 'firebase/app';

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
  isAuthenticated = false;

  private sub!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.auth.user$.subscribe(user => {
      if (user) {
        this.isAuthenticated = true;
        this.router.navigateByUrl('/');
      } else {
        this.isAuthenticated = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  login(loginForm: NgForm): void {
   
    this.error = '';

    this.auth.login(this.form.correo, this.form.password)
      .then(() => {
        
        this.router.navigateByUrl('/');
      })
      .catch((err: unknown) => {
       
        const fbErr = err as FirebaseError;
        if (!fbErr.code) {
          this.error = 'Error de conexión, revisa tu internet';
          return;
        }

        switch (fbErr.code) {
          
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            this.error = 'Credenciales incorrectas, el correo o la contraseña ingresadas no son válidas';
            break;

          default:

            this.error = 'El correo no está registrado, regístrate';
        }
      });
  }

  logout(): void {
    this.auth.logout()
      .then(() => {
        this.router.navigateByUrl('/login');
      })
      .catch(() => {
        // silencio
      });
  }

  clearError(): void {
    this.error = '';
  }
}
