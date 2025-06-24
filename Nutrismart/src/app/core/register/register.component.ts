import { Component }    from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router }       from '@angular/router';
import { RouterModule }     from '@angular/router'; 
import { AuthService, NewUserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

    // Preparamos el perfil con rol 'cliente' por defecto
    const profile: NewUserProfile = {
      ...this.form,
      role: 'cliente'
    };

    this.auth.register(profile, this.form.password)
      .then(() => {
        this.mensaje = 'Cuenta creada correctamente.';
        this.router.navigateByUrl('/verify-email'); //corregido para verificar 17
      })
      .catch(err => {
        console.error('Error registrando:', err);
        this.error = err.message || 'Ocurrió un error al crear la cuenta.';
      });
  }
}
