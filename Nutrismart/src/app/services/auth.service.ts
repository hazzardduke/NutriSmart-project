import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  authState,
  user
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import type { User, UserCredential } from 'firebase/auth';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface NewUserProfile {
  cedula: string;
  nombre: string;
  apellidos: string;
  direccion: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  role: 'cliente' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$: Observable<User|null> = user(this.auth);
  isAuthenticated$: Observable<boolean> = authState(this.auth).pipe(map(u => !!u));

  idTokenResult$ = authState(this.auth).pipe(
    switchMap(u => u ? from(u.getIdTokenResult()) : of(null))
  );

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  /** nuevo 16 */
   sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }


   /** nuevo 17 */
  register(profile: NewUserProfile, plainPassword: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, profile.correo, plainPassword)
      .then((cred: UserCredential) => {
        const uid = cred.user.uid;
   
        return setDoc(doc(this.firestore, 'users', uid), {
          ...profile,
          uid,
          createdAt: new Date()
        })
        .then(() => cred.user);
      })
      .then(user => {
        // esto envia el email de verificacion
        return sendEmailVerification(user);
      })
      .then(() => {});
  }


   /** nuevo 17 para reenviar el email de verificacion en caso de algun
    * error y que el usuario no tenga que volver a registrarse
   */
 resendEmailVerification(): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) {
      return Promise.reject('No hay ningún usuario autenticado.');
    }
    return sendEmailVerification(u);
  }

  
  logout(): Promise<void> {
    return signOut(this.auth);
  }
}
