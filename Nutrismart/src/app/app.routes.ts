import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { LoginComponent }             from './core/login/login.component';
import { RegisterComponent }          from './core/register/register.component';
import { DashboardComponent }         from './features/dashboard/dashboard.component';        // tu dashboard cliente
import { DashboardAdminComponent }    from './features/dashboard-admin/dashboard-admin.component';
import { DashboardNutricionistaComponent } from './features/dashboard-nutricionista/dashboard-nutricionista.component';

import { PersonalrecordComponent }    from './core/client/personalrecord/personalrecord.component';
import { AppointmentsComponent }      from './features/appointments/appointments.component';
import { GoalsComponent }             from './features/goals/goals.component';
import { ResetPasswordRequestComponent } from './reset-password-request/reset-password-request.component';
import { NutriScheduleComponent } from './features/nutri-schedule/nutri-schedule.component';
import { LoyaltyCardClientComponent } from './loyalty-card-client/loyalty-card-client.component';
import { LoyaltyCardNutricionistComponent } from './loyalty-card-nutricionist/loyalty-card-nutricionist.component';


export const routes: Routes = [
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordRequestComponent },

  {
    path: '',
    canActivate: [ authGuard ],
    children: [
      // Cliente: tu DashboardComponent existente
      {
        path: '',
        component: DashboardComponent,
        pathMatch: 'full',
        canActivate: [ roleGuard ],
        data: { role: 'cliente' }
      },
      {
        path: 'profile',
        component: PersonalrecordComponent,
        canActivate: [ roleGuard ],
        data: { role: 'cliente' }
      },
      {
        path: 'appoinments',
        component: AppointmentsComponent,
        canActivate: [ roleGuard ],
        data: { role: 'cliente' }
      },
      {
        path: 'goals',
        component: GoalsComponent,
        canActivate: [ roleGuard ],
        data: { role: 'cliente' }
      },
       {
        path: 'loyaltycard',
        component: LoyaltyCardClientComponent,
        canActivate: [ roleGuard ],
        data: { role: 'cliente' }
      },

      // Admin
      {
        path: 'dashboard-admin',
        component: DashboardAdminComponent,
        canActivate: [ roleGuard ],
        data: { role: 'admin' }
      },

      // Nutricionista
      {
        path: 'dashboard-nutricionista',
        component: DashboardNutricionistaComponent,
        canActivate: [ roleGuard ],
        data: { role: 'nutricionista' }
      },
      {
        path: 'nutri-schedule',
        component: NutriScheduleComponent,
        canActivate: [ roleGuard ],
        data: { role: 'nutricionista' }
      },

      
  

       {
        path: 'loyalty-card-nutricionist',
        component: LoyaltyCardNutricionistComponent,
        canActivate: [ roleGuard ],
        data: { role: 'nutricionista' }
      },
    ]
  },


  // fallback
  { path: '**', redirectTo: 'login' }
];
