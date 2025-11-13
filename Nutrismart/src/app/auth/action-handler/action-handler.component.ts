import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { Auth, applyActionCode } from '@angular/fire/auth';

@Component({
  standalone: true,
  selector: 'app-action-handler',
  imports: [CommonModule, ResetPasswordComponent],
  templateUrl: './action-handler.component.html',
  styleUrls: ['./action-handler.component.scss']
})
export class ActionHandlerComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);

  mode: string | null = null;
  oobCode: string | null = null;

  async ngOnInit() {
    this.mode = this.route.snapshot.queryParamMap.get('mode');
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!this.mode || !this.oobCode) {
      await Swal.fire({
        icon: 'error',
        title: 'Enlace inválido',
        text: 'El enlace que usaste no es válido o ha expirado.',
        confirmButtonColor: '#a1c037'
      });
      this.router.navigateByUrl('/login');
      return;
    }

    switch (this.mode) {
      case 'resetPassword':
        this.router.navigate(['/reset-password'], {
          queryParams: { oobCode: this.oobCode }
        });
        break;

      case 'verifyEmail':
        await this.verifyEmail(this.oobCode);
        break;

      default:
        await Swal.fire({
          icon: 'error',
          title: 'Acción desconocida',
          text: 'El enlace no es válido o ya fue utilizado.',
          confirmButtonColor: '#a1c037'
        });
        this.router.navigateByUrl('/login');
        break;
    }
  }

  private async verifyEmail(oobCode: string) {
    try {
      await applyActionCode(this.auth, oobCode);

      await Swal.fire({
        icon: 'success',
        title: 'Correo verificado correctamente',
        html: `
          <p>Tu cuenta ha sido confirmada exitosamente.</p>
          <p>Ahora podés iniciar sesión en tu cuenta NutriSmart.</p>
        `,
        confirmButtonColor: '#a1c037',
        confirmButtonText: 'Ir al login',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: undefined,
        showConfirmButton: true
      });


      this.router.navigateByUrl('/login');
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error al verificar el correo',
        text: 'El enlace puede haber expirado o ya fue utilizado.',
        confirmButtonColor: '#d9534f',
        confirmButtonText: 'Volver al login',
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: undefined,
        showConfirmButton: true
      });
      this.router.navigateByUrl('/login');
    }
  }
}
