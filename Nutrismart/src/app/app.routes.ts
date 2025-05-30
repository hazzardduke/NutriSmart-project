// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent }    from './core/login/login.component';
import { RegisterComponent } from './core/register/register.component';
import { authGuard }         from './guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonalrecordComponent } from './core/client/personalrecord/personalrecord.component';
import { AppointmentsComponent }   from './features/appointments/appointments.component';
import { GoalsComponent }          from './features/goals/goals.component';

export const routes: Routes = [
  // públicas
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // protegidas, sin layout extra (AppComponent ya las envuelve)
  {
    path: '',
    canActivate: [ authGuard ],
    children: [
      { path: '',           component: DashboardComponent, pathMatch: 'full' },
      { path: 'profile',    component: PersonalrecordComponent },
      { path: 'appoinments',component: AppointmentsComponent },
      { path: 'goals',      component: GoalsComponent },
    ]
  },

  // wildcard
  { path: '**', redirectTo: 'login' }
];
