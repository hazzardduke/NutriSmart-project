import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.scss']
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  loading = signal(false);
  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  requisitos = signal({
    mayuscula: false,
    numero: false,
    especial: false,
    longitud: false
  });

  form: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: this.matchPasswords('newPassword', 'confirmNewPassword') });

  get f() { return this.form.controls; }

  passwordMismatch = computed(() =>
    this.form.hasError('passwordsDontMatch') && this.form.get('confirmNewPassword')?.touched
  );

  private matchPasswords(pass: string, confirm: string) {
    return (fg: FormGroup) => {
      const p = fg.get(pass)?.value;
      const c = fg.get(confirm)?.value;
      if (p && c && p !== c) {
        fg.get(confirm)?.setErrors({ passwordsDontMatch: true });
        return { passwordsDontMatch: true };
      } else {
        const errors = fg.get(confirm)?.errors;
        if (errors) {
          delete errors['passwordsDontMatch'];
          if (!Object.keys(errors).length) fg.get(confirm)?.setErrors(null);
        }
        return null;
      }
    };
  }

  validarPasswordTiempoReal() {
    const p = this.f['newPassword'].value || '';
    this.requisitos.set({
      mayuscula: /[A-Z]/.test(p),
      numero: /\d/.test(p),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
      longitud: p.length >= 8
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Campos incompletos', 'Revisá los errores del formulario.', 'warning');
      return;
    }

    const req = this.requisitos();
    if (!(req.mayuscula && req.numero && req.especial && req.longitud)) {
      Swal.fire('Contraseña no válida', 'Debes cumplir todos los requisitos de seguridad.', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Deseás cambiar tu contraseña?',
      text: 'Deberás iniciar sesión nuevamente después del cambio.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#a1c037',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    const user = this.auth.currentUser;
    if (!user) {
      Swal.fire('Sesión inválida', 'Iniciá sesión nuevamente.', 'error');
      return;
    }

    const email = user.email;
    if (!email) {
      Swal.fire('Error', 'Tu cuenta no es de tipo correo y contraseña.', 'info');
      return;
    }

    const current = this.f['currentPassword'].value;
    const newPass = this.f['newPassword'].value;

    try {
      this.loading.set(true);
      const cred = EmailAuthProvider.credential(email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);

      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Tu contraseña fue cambiada correctamente. Iniciá sesión nuevamente.',
        confirmButtonColor: '#a1c037'
      });

      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    } catch (err: any) {
      const code = err?.code || '';
      let msg = 'No se pudo actualizar la contraseña.';
      if (code === 'auth/wrong-password') msg = 'La contraseña actual es incorrecta.';
      else if (code === 'auth/weak-password') msg = 'La nueva contraseña es demasiado débil.';
      else if (code === 'auth/too-many-requests') msg = 'Demasiados intentos fallidos. Intentá más tarde.';
      Swal.fire('Error', msg, 'error');
    } finally {
      this.loading.set(false);
      this.form.reset();
      this.requisitos.set({ mayuscula: false, numero: false, especial: false, longitud: false });
    }
  }

  toggle(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrent.update(v => !v);
    if (field === 'new') this.showNew.update(v => !v);
    if (field === 'confirm') this.showConfirm.update(v => !v);
  }
}
