import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface UserProfileData {
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

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);
  private storage   = inject(Storage);

// ProfileService usando documento único
getProfile(uid: string): Observable<UserProfileData> {
  const refDoc = doc(this.firestore, `users/${uid}`);
  return docData(refDoc) as Observable<UserProfileData>;
}

updateProfile(uid: string, data: Partial<UserProfileData>): Promise<void> {
  const refDoc = doc(this.firestore, `users/${uid}`);
  const now = new Date().toISOString();
  return setDoc(refDoc, { ...data, fechaActualizacion: now }, { merge: true });
}


  /** Sube foto y devuelve URL */
  uploadPhoto(uid: string, file: Blob): Observable<string> {
    const storageRef = ref(this.storage, `profiles/${uid}`);
    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(() => getDownloadURL(storageRef))
    );
  }
}
