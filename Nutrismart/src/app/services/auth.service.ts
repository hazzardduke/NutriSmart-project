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
import {
  Firestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { User, UserCredential, IdTokenResult } from 'firebase/auth';

export interface NewUserProfile {
  cedula: string;
  nombre: string;
  apellidos: string;
  direccion: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  role: 'cliente' | 'admin' | 'nutricionista';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$: Observable<User | null> = user(this.auth);
  isAuthenticated$: Observable<boolean> = authState(this.auth).pipe(map(u => !!u));

  idTokenResult$: Observable<IdTokenResult | null> = this.user$.pipe(
    switchMap(u => u ? from(u.getIdTokenResult()) : of(null))
  );

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  async register(profile: NewUserProfile, plainPassword: string): Promise<void> {
    try {
      const cred: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        profile.correo,
        plainPassword
      );

      const uid = cred.user.uid;

      const { cedula, nombre, apellidos, direccion, fechaNacimiento, telefono, correo } = profile;

      await setDoc(doc(this.firestore, 'users', uid), {
        uid,
        cedula,
        nombre,
        apellidos,
        direccion,
        fechaNacimiento,
        telefono,
        correo,
        role: 'cliente',
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(cred.user);

    } catch (err: any) {
      console.error('Error en registro:', err);
      throw new Error(err.message || 'No se pudo completar el registro.');
    }
  }

  async getUserProfileByEmail(email: string): Promise<NewUserProfile> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('correo', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Usuario no encontrado en perfiles');
    return snap.docs[0].data() as NewUserProfile;
  }

  sendSignInLink(email: string): Promise<void> {
    return sendSignInLinkToEmail(this.auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: true
    });
  }

  isSignInLink(url: string): boolean {
    return isSignInWithEmailLink(this.auth, url);
  }

  completeSignInWithLink(email: string, link: string): Promise<void> {
    return signInWithEmailLink(this.auth, email, link).then(() => {});
  }

  sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  resendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      return Promise.reject('No hay ningún usuario autenticado.');
    }
    return sendEmailVerification(user);
  }
}
