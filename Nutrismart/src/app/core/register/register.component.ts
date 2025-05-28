// src/app/core/register/register.component.ts
import { Component }      from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService }    from '../../services/auth.service';
import { Router }         from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = {
    cedula: '',
    nombre: '',
    apellidos: '',
    direccion: '',
    fechaNacimiento: '',
    telefono: '',
    correo: '',
    password: ''
  };
  mensaje = '';
  error   = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  registrar(registroForm: NgForm) {
    this.mensaje = '';
    this.error   = '';

    if (!registroForm.valid) {
      this.error = 'Por favor corrige los errores del formulario antes de enviar.';
      return;
    }

    this.auth
      .register({ ...this.form, password: this.form.password })
      .subscribe({
        next: () => {
          this.mensaje = '✅ Registro exitoso. Redirigiendo al login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: err => {
          this.error = err.message || 'Error al registrar.';
        }
      });
  }
}
