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

}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore = inject(Firestore);
  private storage   = inject(Storage);

  private profileSubject = new BehaviorSubject<UserProfileData | null>(null);

  // 🔁 Exponer el observable reactivo
  getProfileObservable(): Observable<UserProfileData | null> {
    return this.profileSubject.asObservable();
  }

  // 🟢 Obtener el perfil y emitirlo automáticamente
  getProfile(uid: string): Observable<UserProfileData> {
    const refDoc = doc(this.firestore, `users/${uid}`);
    return docData(refDoc).pipe(
      filter((profile): profile is UserProfileData => profile !== undefined),
      tap(profile => this.profileSubject.next(profile))
    );
  }

  // 🟢 Actualizar el perfil y emitir el nuevo valor
  async updateProfile(uid: string, data: Partial<UserProfileData>): Promise<void> {
    const refDoc = doc(this.firestore, `users/${uid}`);
    const now = new Date().toISOString();
    await setDoc(refDoc, { ...data, fechaActualizacion: now }, { merge: true });

    // Emitir nueva versión del perfil manualmente después del update
    const updatedRef = doc(this.firestore, `users/${uid}`);
    const updatedProfile = await docData(updatedRef).toPromise();
    this.profileSubject.next(updatedProfile as UserProfileData);
  }

  uploadPhoto(uid: string, file: Blob): Observable<string> {
    const storageRef = ref(this.storage, `profiles/${uid}`);
    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }
}
