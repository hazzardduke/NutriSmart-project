import { Routes } from '@angular/router';
import { LoginComponent }    from './core/login/login.component';
import { RegisterComponent } from './core/register/register.component';
import { authGuard }         from './guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  // Rutas públicas
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Rutas protegidas
  {
    path: '',
    canActivate: [authGuard],
    component: DashboardComponent,   // o un DashboardLayoutComponent si lo tienes
    children: [
      // aquí tus rutas internas, p.ej.
      { path: '',          component: DashboardComponent },
      // etc.
    ]
  },

  // Cualquier otra va al login o 404
  { path: '**', redirectTo: 'login' }
];
