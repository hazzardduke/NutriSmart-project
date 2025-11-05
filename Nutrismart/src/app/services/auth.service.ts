import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  user,
  authState,
  setPersistence,
  browserSessionPersistence
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  docData
} from '@angular/fire/firestore';
import { httpsCallable, Functions } from '@angular/fire/functions';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { User, IdTokenResult, UserCredential } from 'firebase/auth';

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
  private functions = inject(Functions);

  user$: Observable<User | null> = user(this.auth);

  isAuthenticated$: Observable<boolean> = authState(this.auth).pipe(map(u => !!u));

  idTokenResult$: Observable<IdTokenResult | null> = this.user$.pipe(
    switchMap(u => (u ? from(u.getIdTokenResult()) : of(null)))
  );

  userProfile$: Observable<(User & { role?: string }) | null> = authState(this.auth).pipe(
    switchMap(u => {
      if (!u) return of(null);
      const ref = doc(this.firestore, `users/${u.uid}`);
      return docData(ref).pipe(
        map(profile => ({
          ...u,
          ...(profile || {})
        }))
      );
    })
  );

  async login(email: string, password: string): Promise<void> {

    await setPersistence(this.auth, browserSessionPersistence);


    await signInWithEmailAndPassword(this.auth, email, password);
  }


  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.removeItem('2faEmail');
    localStorage.removeItem('2faVerified');
  }

  async register(profile: NewUserProfile, plainPassword: string): Promise<void> {
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
      active: true,
      createdAt: serverTimestamp()
    });

    await sendEmailVerification(cred.user);
  }


  async getUserProfileByEmail(email: string): Promise<NewUserProfile> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('correo', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Usuario no encontrado en perfiles');
    return snap.docs[0].data() as NewUserProfile;
  }


  sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }


  resendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return Promise.reject('No hay ningún usuario autenticado.');
    return sendEmailVerification(user);
  }


  async sendTwoFactorCode(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const ref = doc(this.firestore, 'twofa', email);
    await setDoc(ref, { code, expiresAt, createdAt: serverTimestamp() });

    const profile = await this.getUserProfileByEmail(email);
    const nombreCompleto = `${profile.nombre} ${profile.apellidos}`;

    const sendEmailFn = httpsCallable(this.functions, 'sendEmail');
    await sendEmailFn({
      to: email,
      subject: 'Tu código de verificación - NutriSmart',
      text: `Hola ${nombreCompleto},

Tu código de verificación es: ${code}

Por motivos de seguridad, este código expirará en 5 minutos.

Si no solicitaste este código, puedes ignorar este mensaje.

Gracias,
El equipo de NutriSmart`
    });

    localStorage.setItem('2faEmail', email);
    localStorage.removeItem('2faVerified');
  }

  async verifyTwoFactorCode(email: string, code: string): Promise<boolean> {
    const ref = doc(this.firestore, 'twofa', email);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const data = snap.data() as { code: string; expiresAt: number };
    const valid = data.code === code && Date.now() < data.expiresAt;

    if (valid) {
      await deleteDoc(ref);
      localStorage.setItem('2faVerified', 'true');
      localStorage.removeItem('2faEmail');
    }

    return valid;
  }


  async clearTwoFactorRecord(email: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'twofa', email));
    } catch (_) {}
  }
}
