// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  docData,
  setDoc,
  doc
} from '@angular/fire/firestore';
import { Observable, of, from } from 'rxjs';
import { switchMap, map }       from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  direccion: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$: Observable<UserProfile | null> = authState(this.auth).pipe(
    switchMap((user: User | null) => {
      if (!user) return of(null);
      return docData(doc(this.firestore, `users/${user.uid}`)) as Observable<UserProfile>;
    }),
    map(profile => profile ?? null)
  );

  isAuthenticated$: Observable<boolean> = this.user$.pipe(
    map(user => !!user)
  );

  register(data: Omit<UserProfile,'uid'> & { password: string }): Observable<void> {
    const { password, ...profile } = data;
    return from(createUserWithEmailAndPassword(this.auth, data.correo, password)).pipe(
      switchMap(cred =>
        setDoc(doc(this.firestore, 'users', cred.user.uid), {
          uid: cred.user.uid,
          ...profile
        })
      )
    );
  }

  login(correo: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, correo, password)).pipe(map(() => {}));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
}
