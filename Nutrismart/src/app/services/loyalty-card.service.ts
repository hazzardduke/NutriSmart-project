// src/app/services/loyalty-card.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  collectionData,
  updateDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { switchMap, map, take } from 'rxjs/operators';
import { of, Observable, firstValueFrom } from 'rxjs';

export interface LoyaltyCard {
  id: string;
  userId: string;
  stamps: number;
  createdAt: any;
  updatedAt: any;
}

export interface RedeemEntry {
  id?: string;
  date: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyCardService {
  private fs = inject(Firestore);
  private auth = inject(AuthService);

  /** Obtener la tarjeta del usuario o null si no existe */
  getMyCard(): Observable<LoyaltyCard | null> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of(null);
        const colRef = collection(this.fs, `users/${u.uid}/loyaltyCards`);
        return collectionData(colRef, { idField: 'id' }).pipe(
          map((arr: any[]) =>
            arr.length
              ? (arr[0] as LoyaltyCard)
              : null
          )
        );
      })
    );
  }

  /** Crear la tarjeta con 0 sellos si no existe */
  async createCard(): Promise<void> {
    const user = await firstValueFrom(this.auth.user$);
    if (!user) throw new Error('Usuario no autenticado');
    const cardRef = doc(
      this.fs,
      `users/${user.uid}/loyaltyCards/${user.uid}`
    );
    await setDoc(
      cardRef,
      {
        userId:    user.uid,
        stamps:    0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  /** Canjear recompensa: resetear sellos y registrar en historial */
  async redeem(): Promise<void> {
    const user = await firstValueFrom(this.auth.user$);
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener carta actual
    const card = await firstValueFrom(
      this.getMyCard().pipe(take(1))
    );
    if (!card || card.stamps < 7) {
      throw new Error('No tienes suficientes sellos para canjear');
    }

    // Resetear sellos
    const cardRef = doc(
      this.fs,
      `users/${user.uid}/loyaltyCards/${card.id}`
    );
    await updateDoc(cardRef, {
      stamps:    0,
      updatedAt: serverTimestamp()
    });

    // Agregar entrada al historial
    const historyCol = collection(
      this.fs,
      `users/${user.uid}/loyaltyCards/${card.id}/history`
    );
    await addDoc(historyCol, {
      date:    new Date().toISOString().split('T')[0],
      message: 'Cita nutricional gratis'
    });
  }

  /** Recuperar historial de canjes ordenado por fecha descendente */
  getRedeemHistory(): Observable<RedeemEntry[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        const historyCol = collection(
          this.fs,
          `users/${u.uid}/loyaltyCards/${u.uid}/history`
        );
        return collectionData(historyCol, { idField: 'id' }) as Observable<RedeemEntry[]>;
      }),
      map(arr =>
        arr.sort((a, b) => (b.date > a.date ? 1 : b.date > a.date ? -1 : 0))
      )
    );
  }
}
