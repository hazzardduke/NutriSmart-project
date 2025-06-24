import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

export interface UserProfileData {
  nombre?: string;
  apellido?: string;
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
  role?: 'cliente' | 'admin' | 'nutricionista';  // <-- agregado
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);
  private storage   = inject(Storage);

  private profileSubject = new BehaviorSubject<UserProfileData | null>(null);

  /** Observable para suscribirse al perfil */
  getProfileObservable(): Observable<UserProfileData | null> {
    return this.profileSubject.asObservable();
  }

  /** Lee el perfil desde Firestore y emite por el subject */
  getProfile(uid: string): Observable<UserProfileData> {
    const refDoc = doc(this.firestore, `users/${uid}`);
    return docData(refDoc).pipe(
      filter((profile): profile is UserProfileData => profile !== undefined),
      tap(profile => this.profileSubject.next(profile))
    );
  }

  /** Actualiza campos del perfil y reemite el perfil actualizado */
  async updateProfile(uid: string, data: Partial<UserProfileData>): Promise<void> {
    const refDoc = doc(this.firestore, `users/${uid}`);
    const now = new Date().toISOString();
    await setDoc(refDoc, { ...data, fechaActualizacion: now }, { merge: true });
    // Leer y emitir perfil actualizado
    const updated = await docData(refDoc).pipe(filter(Boolean)).toPromise();
    this.profileSubject.next(updated as UserProfileData);
  }

  /** Sube foto y retorna la URL */
  uploadPhoto(uid: string, file: Blob): Observable<string> {
    const storageRef = ref(this.storage, `profiles/${uid}`);
    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }
}
