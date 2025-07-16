import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  collection,
  collectionData,
  query,
  where
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { filter, switchMap, tap, map } from 'rxjs/operators';

export interface UserProfileData {
  nombre?: string;
  apellido?: string;   // nominaremos así internamente
  apellidos?: string;  // puede venir así de Firestore
  cedula?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  peso?: number;
  estatura?: number;
  porcentajeGrasa?: number;
  porcentajeMusculo?: number;
  porcentajeAgua?: number;
  restricciones?: string;
  fotoURL?: string;
  fechaActualizacion?: string;
  role?: 'cliente' | 'admin' | 'nutricionista';
}

export interface ClientProfile {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);
  private storage   = inject(Storage);
  private profileSubject = new BehaviorSubject<UserProfileData | null>(null);

  /** Perfil actual */
  getProfileObservable() {
    return this.profileSubject.asObservable();
  }

  getProfile(uid: string): Observable<UserProfileData> {
    const refDoc = doc(this.firestore, `users/${uid}`);
    return docData(refDoc).pipe(
      filter((p): p is UserProfileData => !!p),
      tap(p => this.profileSubject.next(p))
    );
  }

  async updateProfile(uid: string, data: Partial<UserProfileData>) {
    const refDoc = doc(this.firestore, `users/${uid}`);
    const now = new Date().toISOString();
    await setDoc(refDoc, { ...data, fechaActualizacion: now }, { merge: true });
    const updated = await docData(refDoc).pipe(filter(Boolean)).toPromise();
    this.profileSubject.next(updated as UserProfileData);
  }

  uploadPhoto(uid: string, file: Blob): Observable<string> {
    const storageRef = ref(this.storage, `profiles/${uid}`);
    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }

 
  getClients(): Observable<ClientProfile[]> {
    const usersColl = collection(this.firestore, 'users');
    const q = query(usersColl, where('role', '==', 'cliente'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((list: any[]) =>
        list.map(u => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellidos ?? u.apellido ?? '',
          cedula: u.cedula ?? '',
          correo: u.correo ?? ''
        }))
      )
    );
  }
}
