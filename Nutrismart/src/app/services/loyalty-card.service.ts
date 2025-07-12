// src/app/services/loyalty-card.service.ts
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
import { of, from, Observable } from 'rxjs';

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
 addStamp(): Promise<void> {
    return this.auth.user$.pipe(
      switchMap(async u => {
        if (!u) throw new Error('No autenticado');
        const path   = `users/${u.uid}/loyaltyCards`;
        const colRef = collection(this.fs, path);
        const snap   = await getDocs(colRef);

        if (!snap.empty) {
          // Incrementa pero reinicia a 0 tras 7
          const cardDoc = snap.docs[0];
          const data    = cardDoc.data() as LoyaltyCard;
          const ref     = doc(this.fs, `${path}/${cardDoc.id}`);
          const next    = (data.stamps + 1) % 8; // 0..7
          await updateDoc(ref, {
            stamps:    next,
            updatedAt: serverTimestamp()
          });
        } else {
          // Crea con 1 sello
          const ref = doc(this.fs, `${path}/${u.uid}`);
          await setDoc(ref, {
            userId:    u.uid,
            stamps:    1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      })
    ).toPromise().then(() => {});
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
