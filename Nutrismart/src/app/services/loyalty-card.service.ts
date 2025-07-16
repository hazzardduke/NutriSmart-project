import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  collection,
  collectionData,
  getDocs,
  updateDoc,
  setDoc,
  serverTimestamp,
  DocumentReference
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { switchMap, map, take } from 'rxjs/operators';
import { of, from, Observable, firstValueFrom } from 'rxjs';

export interface LoyaltyCard {
  id: string;
  userId: string;
  stamps: number;
  createdAt: any;
  updatedAt: any;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyCardService {
  private fs = inject(Firestore);
  private auth = inject(AuthService);

  /** obtener la tarjeta o null si njo existe */
  getMyCard(): Observable<LoyaltyCard|null> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of(null);
        const col = collection(this.fs, `users/${u.uid}/loyaltyCards`);
        return collectionData(col, { idField: 'id' }).pipe(
          map((arr: any[]) => arr.length ? (arr[0] as LoyaltyCard) : null)
        );
      })
    );
  }

  /** agregar un sello y crear la tarjeta si no existe*/
  async createCard(): Promise<void> {
    const user = await firstValueFrom(this.auth.user$);
    if (!user) throw new Error('No autenticado');

    const ref = doc(this.fs, `users/${user.uid}/loyaltyCards/${user.uid}`);
    
    await setDoc(
      ref,
      {
        userId:    user.uid,
        stamps:    0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }  
    );
  }

  /** canjear recompensa opcioncional */
  async redeem(): Promise<void> {
    const card = await this.getMyCard().pipe(take(1)).toPromise();
    if (card && card.stamps >= 7) {
      const ref = doc(this.fs, `users/${card.userId}/loyaltyCards/${card.id}`);
      await updateDoc(ref, {
        stamps: 0,
        updatedAt: serverTimestamp()
      });
    }
  }
}
