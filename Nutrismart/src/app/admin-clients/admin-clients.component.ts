import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AdminUsersService, UserProfile, UserRole } from '../services/admin-users.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-clients.component.html',
  styleUrls: ['./admin-clients.component.scss']
})
export class AdminClientsComponent implements OnInit, OnDestroy {
  users$!: Observable<UserProfile[]>;
  private sub?: Subscription;
  private snapshot: UserProfile[] = [];

  roles: UserRole[] = ['cliente', 'nutricionista', 'admin'];

  editForm = new FormGroup({
    uid:      new FormControl<string | null>(null),
    nombre:   new FormControl<string>(''),
    telefono: new FormControl<string>(''),
    correo:   new FormControl<string>({ value: '', disabled: true }),
    active:   new FormControl<boolean>(true),
    role:     new FormControl<UserRole>('cliente')
  });

  constructor(private svc: AdminUsersService) {}

  ngOnInit(): void {
    this.users$ = this.svc.getAllUsers();
    this.sub = this.users$.subscribe(list => (this.snapshot = list ?? []));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onToggleActive(user: UserProfile) {
    this.svc.toggleActive(user.uid, !user.active).catch(console.error);
  }

  onEdit(user: UserProfile) {
    this.editForm.reset({
      uid: user.uid,
      nombre: user.nombre ?? '',
      telefono: user.telefono ?? '',
      correo: user.correo ?? '',
      active: user.active ?? true,
      role: user.role ?? 'cliente'
    });
  }

  saveEdit() {
    const v = this.editForm.value;
    if (!v.uid) return;

    this.svc.updateUser(v.uid!, {
      nombre: v.nombre ?? '',
      telefono: v.telefono ?? '',
      active: v.active ?? true
    })
    .then(async () => {
      if (v.role) {
        await this.svc.updateRole(v.uid!, v.role as UserRole);
      }
      await Swal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        showConfirmButton: false,
        timer: 1200
      });
    })
    .catch(async (err) => {
      console.error(err);
      await Swal.fire({ icon: 'error', title: 'Error al guardar', text: String(err) });
    });
  }

  /** Cambio de rol desde la tabla, con confirmación y UI optimista */
  async onRoleChange(user: UserProfile, newRole: string, selectEl: HTMLSelectElement) {
    const role = newRole as UserRole;
    const prev = user.role;
    if (prev === role) return;

    // Proteger al último admin
    if (prev === 'admin' && role !== 'admin') {
      const admins = this.snapshot.filter(u => u.role === 'admin').length;
      if (admins <= 1) {
        await Swal.fire({
          icon: 'warning',
          title: 'Acción no permitida',
          text: 'No puedes remover el último administrador del sistema.'
        });
        // revertir select
        selectEl.value = prev;
        return;
      }
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: 'Confirmar cambio de rol',
      html: `¿Cambiar el rol de <b>${user.nombre || user.correo}</b> de <b>${prev}</b> a <b>${role}</b>?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a1c037', // verde personalizado
      cancelButtonColor: '#6c757d'   // gris
    });

    if (!isConfirmed) {
      // revertir si cancela
      selectEl.value = prev;
      return;
    }

    // UI optimista
    user.role = role;
    try {
      await this.svc.updateRole(user.uid, role);
      await Swal.fire({
        icon: 'success',
        title: 'Rol actualizado',
        showConfirmButton: false,
        timer: 1100
      });
    } catch (err) {
      console.error(err);
      // revertir si falla
      user.role = prev;
      selectEl.value = prev;
      await Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: String(err) });
    }
  }
}
