// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent }    from './core/login/login.component';
import { RegisterComponent } from './core/register/register.component';
import { ResetPasswordRequestComponent } from './reset-password-request/reset-password-request.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonalrecordComponent } from './core/client/personalrecord/personalrecord.component';
import { AppointmentsComponent }   from './features/appointments/appointments.component';
import { GoalsComponent }          from './features/goals/goals.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordRequestComponent },

  {
    path: '',
    canActivate: [ authGuard ],
    children: [
      { path: '',            component: DashboardComponent,    pathMatch: 'full' },
      { path: 'profile',     component: PersonalrecordComponent },
      { path: 'appointments',component: AppointmentsComponent  },
      { path: 'goals',       component: GoalsComponent         },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
