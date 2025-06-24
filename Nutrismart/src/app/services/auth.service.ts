// src/app/services/auth.service.ts
import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  authState,
  user
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, query, where, collection, getDocs } from '@angular/fire/firestore';
import type { User, UserCredential, Auth as FirebaseAuth } from 'firebase/auth';
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

  /** Login normal con correo+contraseña */
  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {});
  }

  /** Enviar magic link al admin */
  sendSignInLink(email: string): Promise<void> {
    return sendSignInLinkToEmail(this.auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    });
  }

  /** ¿es este enlace uno de Firebase magic-links? */
  isSignInLink(url: string): boolean {
    return isSignInWithEmailLink(this.auth, url);
  }

  /** Completar el magic-link */
  completeSignInWithLink(email: string, link: string): Promise<void> {
    return signInWithEmailLink(this.auth, email, link).then(() => {});
  }



  /** Registrar un usuario (cliente o admin) */
  /** nuevo 16 */
   sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }


   /** nuevo 17 */
  register(profile: NewUserProfile, plainPassword: string): Promise<void> {
    // 1) Crear la cuenta en Firebase Auth
    return createUserWithEmailAndPassword(this.auth, profile.correo, plainPassword)
      .then((cred: UserCredential) => {
        // 2) Usar el UID que Firebase te devuelve para almacenar el perfil
        const uid = cred.user.uid;
   
        return setDoc(doc(this.firestore, 'users', uid), {
          ...profile,
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


  /** Recuperar el perfil de Firestore por correo */
  async getUserProfileByEmail(email: string): Promise<NewUserProfile> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('correo', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Usuario no encontrado en perfiles');
    const data = snap.docs[0].data() as NewUserProfile;
    return data;
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

