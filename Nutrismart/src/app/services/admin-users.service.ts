import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type UserRole = 'cliente' | 'nutricionista' | 'admin';

export interface UserProfile {
  uid: string;
  nombre: string;
  correo: string;
  telefono?: string;
  role: UserRole;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private fs = inject(Firestore);

  /** Trae TODOS los usuarios y normaliza campos (incluye 'role') */
  getAllUsers(): Observable<UserProfile[]> {
    const col = collection(this.fs, 'users');
    return collectionData(col, { idField: 'uid' }).pipe(
      map((arr: any[]) =>
        arr.map((u) => {
          // Cubrimos posibles ubicaciones/nombres del rol
          const rawRole =
            u.role ??
            u.rol ??
            u?.profile?.role ??
            u?.claims?.role ??
            u?.customClaims?.role;

          const role: UserRole =
            rawRole === 'admin' || rawRole === 'nutricionista' || rawRole === 'cliente'
              ? rawRole
              : 'cliente';

          return {
            uid:       u.uid,
            nombre:    u.nombre ?? '',
            correo:    u.correo ?? '',
            telefono:  u.telefono ?? '',
            role,
            active:    u.active ?? true
          } as UserProfile;
        })
      )
    );
  }

  toggleActive(uid: string, isActive: boolean) {
    const ref = doc(this.fs, `users/${uid}`);
    return updateDoc(ref, { active: isActive });
  }

  updateUser(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'role'>>) {
    const ref = doc(this.fs, `users/${uid}`);
    return updateDoc(ref, data);
  }

  updateRole(uid: string, role: UserRole) {
    const ref = doc(this.fs, `users/${uid}`);
    return updateDoc(ref, { role });
  }
}
