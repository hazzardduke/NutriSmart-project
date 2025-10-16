import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
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

  maxDate: string = '';

  constructor(private auth: AuthService, private router: Router) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 1);
    this.maxDate = hoy.toISOString().split('T')[0];
  }

  soloNumeros(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    const name = input.getAttribute('name');
    if (name && this.form.hasOwnProperty(name)) {
      (this.form as any)[name] = input.value;
    }
  }

  registrar(registroForm: NgForm) {
    if (!registroForm.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor corrige los errores antes de continuar.',
        confirmButtonColor: '#a1c037'
      });
      return;
    }

    const profile: NewUserProfile = {
      ...this.form,
      role: 'cliente'
    };


    Swal.fire({
      title: 'Creando cuenta...',
      html: `
        <img src="assets/images/logontg.png" alt="Nutrition To Go" style="width:90px; margin-bottom:10px;">
        <br><b>Por favor espera un momento</b>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.auth.register(profile, this.form.password)
      .then(() => {
        Swal.close();

        Swal.fire({
          icon: 'success',
          title: 'Cuenta creada correctamente',
          html: `
            <p>Por favor verifica tu correo electrónico para activar tu cuenta.</p>

          `,
          confirmButtonColor: '#a1c037'
        }).then(() => {
          this.router.navigateByUrl('/verify-email');
        });
      })
      .catch(err => {
        Swal.close();

        console.error('Error completo de Firebase:', err);
        let titulo = 'Error al registrar';
        let mensaje = '';
        let codigo = err?.code || 'desconocido';

        if (codigo === 'desconocido' && err?.message?.includes('(auth/')) {
          const match = err.message.match(/\(auth\/([^)]+)\)/);
          if (match && match[1]) codigo = 'auth/' + match[1];
        }

        switch (codigo) {
          case 'auth/email-already-in-use':
            mensaje = 'Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.';
            break;
          case 'auth/invalid-email':
            mensaje = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            mensaje = 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
            break;
          case 'auth/missing-email':
            mensaje = 'Debes ingresar un correo electrónico.';
            break;
          case 'auth/network-request-failed':
            mensaje = 'Error de conexión. Verifica tu red e inténtalo de nuevo.';
            break;
          case 'auth/internal-error':
            mensaje = 'Error interno del servidor. Intenta nuevamente en unos minutos.';
            break;
          default:
            mensaje = err?.message || 'Ocurrió un error al crear la cuenta.';
            break;
        }

        Swal.fire({
          icon: 'error',
          title: titulo,
          html: `
            <p style="font-weight: 500; color:#333;">${mensaje}</p>

          `,
          confirmButtonColor: '#d9534f'
        });
      });
  }
}
