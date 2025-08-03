// src/app/services/client-nutrition-plan.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, filter, take, catchError, shareReplay } from 'rxjs/operators';
import type { FirebaseError } from 'firebase/app';

export interface PortionCategory {
  desayuno: number;
  merienda1: number;
  almuerzo: number;
  merienda2: number;
  cena: number;
}

export interface PortionBasedPlan {
  clientId: string;
  client: { name: string; cedula: string; date: string };
  portions: Record<string, PortionCategory>;
  createdAt?: any;
  pdfUrl?: string;
}

export interface SavedPlan extends PortionBasedPlan {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientNutritionPlanService {
  private collectionName = 'nutritionPlans';

  constructor(private afs: Firestore, private auth: Auth) {}

  getMyPlans(): Observable<SavedPlan[]> {
    return user(this.auth).pipe(
      filter(u => !!u), // espera a que el usuario esté definido
      take(1),
      switchMap(u => {
        const uid = u!.uid;
        console.log('[ClientNutritionPlanService] auth uid:', uid);
        const colRef = collection(this.afs, this.collectionName);
        const q = query(
          colRef,
          where('clientId', '==', uid),
          orderBy('createdAt', 'desc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<SavedPlan[]>;
      }),
      catchError((err: unknown) => {
        console.warn('[ClientNutritionPlanService] error fetching plans:', err);
        if ((err as FirebaseError)?.code === 'permission-denied') {
          return throwError(() => new Error('permission-denied'));
        }
        return throwError(() => err as Error);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  totalPorciones(cat: PortionCategory): number {
    return (
      (cat.desayuno || 0) +
      (cat.merienda1 || 0) +
      (cat.almuerzo || 0) +
      (cat.merienda2 || 0) +
      (cat.cena || 0)
    );
  }
}
