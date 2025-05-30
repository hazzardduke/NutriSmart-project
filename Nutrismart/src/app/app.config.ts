// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding }                                from '@angular/router';
import { provideHttpClient }                            from '@angular/common/http';

import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp }        from 'firebase/app';

import { provideAuth }    from '@angular/fire/auth';
import { getAuth }        from 'firebase/auth';

import { provideFirestore } from '@angular/fire/firestore';
import { getFirestore }     from 'firebase/firestore';

import { provideDatabase } from '@angular/fire/database';
import { getDatabase }     from 'firebase/database';

import { routes }         from './app.routes';
import { firebaseConfig } from '../environments/environment';

import { getStorage } from 'firebase/storage';
import { provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),

    // Inicializa Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),

    // ** ¡IMPORTANTE! ** Provee Auth
    provideAuth(() => getAuth()),

    // Si también usas Firestore y RTDB:
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(()   => getStorage()),
  ]
};
