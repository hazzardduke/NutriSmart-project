// src/app/core/login/login.component.ts
import { Component, OnInit }      from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormsModule, NgForm }    from '@angular/forms';
import { Router, RouterLink }                 from '@angular/router';
import { AuthService }            from '../../services/auth.service';
import { Subscription }           from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = { correo: '', password: '' };
  error = '';
  isAuthenticated = false;

  private sub!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // mantener isAuthenticated sincronizado con el user$
    this.sub = this.auth.user$.subscribe(user => {
      this.isAuthenticated = !!user;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  login(loginForm: NgForm) {
    this.error = '';
    if (!loginForm.valid) {
      this.error = 'Corrige los errores del formulario antes de enviar.';
      return;
    }
    this.auth.login(this.form.correo, this.form.password).subscribe({
      next: () => {
        // redirige al home o donde quieras
        this.router.navigate(['/']);
      },
      error: err => {
        this.error = err.message || 'Error al iniciar sesión.';
      }
    });
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.form = { correo: '', password: '' };
      this.router.navigate(['/login']);
    });
  }
}
