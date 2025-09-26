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

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  isModalOpen: boolean = false;

  editForm = new FormGroup({
    uid:        new FormControl<string | null>(null),
    nombre:     new FormControl<string>(''),
    apellidos:  new FormControl<string>(''),
    cedula:     new FormControl<string>(''),
    telefono:   new FormControl<string>(''),
    direccion:  new FormControl<string>(''),
    correo:     new FormControl<string>(''),
    active:     new FormControl<boolean>(true),
    role:       new FormControl<UserRole>('cliente')
  });

  constructor(private svc: AdminUsersService) {}

  ngOnInit(): void {
    this.users$ = this.svc.getAllUsers();
    this.sub = this.users$.subscribe(list => (this.snapshot = list ?? []));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  filteredUsers(): UserProfile[] {
    const term = this.searchTerm.toLowerCase();
    return this.snapshot.filter(u =>
      (u.nombre?.toLowerCase().includes(term) ||
       u.apellidos?.toLowerCase().includes(term) ||
       u.cedula?.toLowerCase().includes(term) ||
       u.telefono?.toLowerCase().includes(term) ||
       u.direccion?.toLowerCase().includes(term) ||
       u.correo?.toLowerCase().includes(term) ||
       u.role?.toLowerCase().includes(term))
    );
  }

  totalPages(): number {
    return Math.ceil(this.filteredUsers().length / this.pageSize) || 1;
  }

  pagesArray(): number[] {
    return Array(this.totalPages()).fill(0).map((_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  onToggleActive(user: UserProfile) {
    this.svc.toggleActive(user.uid, !user.active).catch(console.error);
  }

  onEdit(user: UserProfile) {
    this.editForm.setValue({
      uid: user.uid,
      nombre: user.nombre ?? '',
      apellidos: user.apellidos ?? '',
      cedula: user.cedula ?? '',
      telefono: user.telefono ?? '',
      direccion: user.direccion ?? '',
      correo: user.correo ?? '',
      active: user.active ?? true,
      role: user.role ?? 'cliente'
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.editForm.reset();
    this.isModalOpen = false;
  }

  saveEdit() {
    const v = this.editForm.value;
    if (!v.uid) return;

    this.svc.updateUser(v.uid!, {
      nombre: v.nombre ?? '',
      apellidos: v.apellidos ?? '',
      cedula: v.cedula ?? '',
      telefono: v.telefono ?? '',
      direccion: v.direccion ?? '',
      active: v.active ?? true
    })
    .then(async () => {
      if (v.role) await this.svc.updateRole(v.uid!, v.role as UserRole);
      await Swal.fire({ icon: 'success', title: 'Cambios guardados', timer: 1200, showConfirmButton: false });
      this.closeModal();
    })
    .catch(err => Swal.fire({ icon: 'error', title: 'Error', text: String(err) }));
  }
}
