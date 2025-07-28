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

export interface UserProfile {
  uid: string;
  nombre: string;
  correo: string;
  telefono?: string;
  role: 'cliente' | 'nutricionista' | 'admin';
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private fs = inject(Firestore);

  getAllClients(): Observable<UserProfile[]> {
    const col = collection(this.fs, 'users');
    return collectionData(col, { idField: 'uid' }).pipe(
      map((arr: any[]) =>
        arr
          .filter(u => u.role === 'cliente')
          .map(u => ({
            uid:     u.uid,
            nombre:  u.nombre,
            correo:  u.correo,
            telefono:u.telefono,
            role:    u.role,
            active:  u.active ?? true
          }))
      )
    );
  }

  updateClient(uid: string, data: Partial<Omit<UserProfile,'uid'|'role'>>) {
    const ref = doc(this.fs, `users/${uid}`);
    return updateDoc(ref, data);
  }

  toggleActive(uid: string, isActive: boolean) {
    const ref = doc(this.fs, `users/${uid}`);
    return updateDoc(ref, { active: isActive });
  }
}
