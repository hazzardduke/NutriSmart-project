import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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


  register(profile: NewUserProfile, plainPassword: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, profile.correo, plainPassword)
      .then((cred: UserCredential) => {

        const uid = cred.user.uid;
        return setDoc(doc(this.firestore, 'users', uid), {
          ...profile,
          uid,
          createdAt: new Date()
        });
      })
      .then(() => {});
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}
