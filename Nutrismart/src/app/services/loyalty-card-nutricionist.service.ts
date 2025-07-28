import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  doc,
  docData,
  getDoc,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export interface LoyaltyCard {
  id:        string;
  userId:    string;
  stamps:    number;
  createdAt: any;
  updatedAt: any;
}

export interface UserSummary {
  uid: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  
}

export interface ClientWithStamps extends UserSummary {
  stamps: number;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyCardNutricionistService {
  private fs = inject(Firestore);

 
  listClients(): Observable<UserSummary[]> {
    const usersCol = collection(this.fs, 'users');
    const q        = query(usersCol, where('role', '==', 'cliente'));
    return collectionData(q, { idField: 'uid' }).pipe(
      map(arr => (arr as any[]).map(u => ({
        uid: u.uid,
          nombre: u.nombre,
          apellidos: u.apellidos,
          cedula: u.cedula
      })))
    );
  }


  async addStampTo(userId: string): Promise<void> {
  const cardRef = doc(this.fs, `users/${userId}/loyaltyCards/${userId}`);
  const snap    = await getDoc(cardRef);

  if (!snap.exists()) {
    await setDoc(cardRef, {
      userId,
      stamps:    1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    const data = snap.data() as LoyaltyCard;
    const next = (data.stamps + 1) % 8;
    await updateDoc(cardRef, {
      stamps:    next,
      updatedAt: serverTimestamp()
    });
  }
}


  
  getClientsWithStamps(): Observable<ClientWithStamps[]> {
    return this.listClients().pipe(
      switchMap(clients =>
        combineLatest(
          clients.map(c => {
            const cardRef = doc(this.fs, `users/${c.uid}/loyaltyCards/${c.uid}`);
            return docData(cardRef, { idField: 'id' }).pipe(
              map((card: any) => ({ ...c, stamps: card.stamps ?? 0 })),
              catchError(() => of({ ...c, stamps: 0 }))
            );
          })
        )
      )
    );
  }
}
