import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { AdminUsersService, UserProfile } from '../services/admin-users.service';
import { Observable }        from 'rxjs';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './admin-clients.component.html',
  styleUrls: ['./admin-clients.component.scss']
})
export class AdminClientsComponent implements OnInit {
  clients$!: Observable<UserProfile[]>;
  editForm = new FormGroup({
    uid:      new FormControl<string | null>(null),
    nombre:   new FormControl(''),
    telefono: new FormControl(''),
    correo:   new FormControl({ value: '', disabled: true }),
    active:   new FormControl(true)
  });

  constructor(private svc: AdminUsersService) {}

  ngOnInit() {
    this.clients$ = this.svc.getAllClients();
  }

  onToggleActive(client: UserProfile) {
    this.svc.toggleActive(client.uid, !client.active)
      .catch(console.error);
  }

  onEdit(client: UserProfile) {
    this.editForm.reset({
      uid: client.uid,
      nombre: client.nombre,
      telefono: client.telefono,
      correo: client.correo,
      active: client.active
    });
  }

  saveEdit() {
    const v = this.editForm.value;
    if (!v.uid) return;
    this.svc.updateClient(v.uid, {
      nombre: v.nombre!,
      telefono: v.telefono!,
      active: v.active!
    }).catch(console.error);
  }
}
