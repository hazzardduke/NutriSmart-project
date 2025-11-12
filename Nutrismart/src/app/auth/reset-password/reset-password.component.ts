import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, confirmPasswordReset } from '@angular/fire/auth';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);
  requisitos = signal({
    mayuscula: false,
    numero: false,
    especial: false,
    longitud: false
  });

  oobCode: string | null = null;

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]]
  });

  ngOnInit() {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!this.oobCode) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: 'El enlace para restablecer la contraseña no es válido o ha expirado.',
        confirmButtonColor: '#a1c037',
        timer: 8000
      }).then(() => this.router.navigateByUrl('/login'));
    }
  }

  validarPasswordTiempoReal() {
    const p = this.form.get('newPassword')?.value || '';
    this.requisitos.set({
      mayuscula: /[A-Z]/.test(p),
      numero: /\d/.test(p),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
      longitud: p.length >= 8
    });
  }

  mismatch() {
    const newP = this.form.get('newPassword')?.value;
    const confP = this.form.get('confirm')?.value;
    return newP && confP && newP !== confP;
  }

  toggle(field: 'new' | 'confirm') {
    if (field === 'new') this.showNew.update(v => !v);
    if (field === 'confirm') this.showConfirm.update(v => !v);
  }

  async onSubmit() {
    if (this.form.invalid || this.mismatch()) {
      Swal.fire('Error', 'Por favor corregí los campos antes de continuar.', 'warning');
      return;
    }

    const { mayuscula, numero, especial, longitud } = this.requisitos();
    if (!(mayuscula && numero && especial && longitud)) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña no válida',
        html: `
          <ul style="text-align:left;margin-left:30px;">
            <li>Debe tener al menos una mayúscula</li>
            <li>Debe tener al menos un número</li>
            <li>Debe tener un carácter especial</li>
            <li>Mínimo 8 caracteres</li>
          </ul>
        `,
        confirmButtonColor: '#d9534f'
      });
      return;
    }

    try {
      this.loading.set(true);
      const newPassword = this.form.get('newPassword')?.value!;
      await confirmPasswordReset(this.auth, this.oobCode!, newPassword);

      Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Tu contraseña fue cambiada correctamente. Iniciá sesión nuevamente.',
        confirmButtonColor: '#a1c037',
        timer: 7000
      }).then(() => this.router.navigateByUrl('/login'));
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error al cambiar la contraseña',
        text: 'El enlace puede haber expirado o ya fue utilizado.',
        confirmButtonColor: '#d9534f'
      }).then(() => this.router.navigateByUrl('/forgot-password'));
    } finally {
      this.loading.set(false);
    }
  }
}
