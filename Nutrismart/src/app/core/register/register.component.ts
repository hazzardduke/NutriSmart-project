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
  requisitos = {
    mayuscula: false,
    numero: false,
    especial: false,
    longitud: false
  };

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

  soloLetras(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '');
    valor = valor
      .toLowerCase()
      .replace(/(^\w{1})|(\s+\w{1})/g, l => l.toUpperCase());
    input.value = valor;
    const name = input.getAttribute('name');
    if (name && this.form.hasOwnProperty(name)) {
      (this.form as any)[name] = valor;
    }
  }

  formatoDireccion(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/[^a-zA-Z0-9À-ÿ\u00f1\u00d1\s#\-,.]/g, '');
    valor = valor
      .toLowerCase()
      .replace(/(^\w{1})|(\s+\w{1})/g, l => l.toUpperCase());
    input.value = valor;
    const name = input.getAttribute('name');
    if (name && this.form.hasOwnProperty(name)) {
      (this.form as any)[name] = valor;
    }
  }

  validarPasswordTiempoReal() {
    const p = this.form.password || '';
    this.requisitos = {
      mayuscula: /[A-Z]/.test(p),
      numero: /\d/.test(p),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
      longitud: p.length >= 8
    };
  }

  registrar(registroForm: NgForm) {
    const { mayuscula, numero, especial, longitud } = this.requisitos;

    if (!registroForm.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor corrige los errores antes de continuar.',
        confirmButtonColor: '#a1c037'
      });
      return;
    }

    if (!(mayuscula && numero && especial && longitud)) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña no válida',
        html: `
          <p>Debe cumplir con los siguientes requisitos:</p>
          <ul style="text-align:left; margin-left:30px;">
            <li>Al menos una mayúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un carácter especial</li>
            <li>Mínimo 8 caracteres</li>
          </ul>
        `,
        confirmButtonColor: '#d9534f'
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
          html: `<p>Por favor verifica tu correo electrónico para activar tu cuenta.</p>`,
          confirmButtonColor: '#a1c037'
        }).then(() => {
          this.router.navigateByUrl('/verify-email');
        });
      })
      .catch(err => {
        Swal.close();
        let mensaje = '';
        switch (err?.code) {
          case 'auth/email-already-in-use':
            mensaje = 'Este correo ya está registrado.';
            break;
          case 'auth/invalid-email':
            mensaje = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/weak-password':
            mensaje = 'La contraseña es demasiado débil.';
            break;
          case 'auth/network-request-failed':
            mensaje = 'Error de conexión. Verifica tu red e inténtalo de nuevo.';
            break;
          default:
            mensaje = err?.message || 'Ocurrió un error al crear la cuenta.';
            break;
        }
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          html: `<p>${mensaje}</p>`,
          confirmButtonColor: '#d9534f'
        });
      });
  }
}
