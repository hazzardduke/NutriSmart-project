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
    this.sub = this.auth.user$.subscribe(user => {
      if (user) this.router.navigateByUrl('/');
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  login(loginForm: NgForm) {
    this.auth.login(this.form.correo, this.form.password)
      .then(() => this.router.navigateByUrl('/'))
      .catch((err: any) => {
        console.error('Error login:', err);
        // muestra feedback...
      });
  }

  logout() {
    this.auth.logout()
      .then(() => {
        // redirige a login o muestra mensaje...
      })
      .catch((err: any) => console.error('Error al cerrar sesión', err));
  }
}
