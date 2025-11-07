import { Routes } from '@angular/router';

// Guards
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { twoFactorGuard } from './guards/two-factor.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard';

// Core
import { LoginComponent } from './core/login/login.component';
import { RegisterComponent } from './core/register/register.component';

import { ChangePasswordComponent } from './core/changepassword/changepassword.component';
import { AuthVerifyComponent } from './core/auth-verify/auth-verify.component';

// Cliente

import { PersonalrecordComponent } from './features/client/personalrecord/personalrecord.component';
import { AppointmentsComponent } from './features/client/appointments/appointments.component';

import { ClientNutritionPlansComponent } from './features/client/client-nutrition-plans/client-nutrition-plans.component';

// Nutricionista







// Admin

import { DashboardComponent } from './features/client/dashboard/dashboard.component';
import { GoalsComponent } from './features/client/goals/goals.component';
import { LoyaltyCardClientComponent } from './features/client/loyalty-card-client/loyalty-card-client.component';
import { ResetPasswordRequestComponent } from './core/reset-password-request/reset-password-request.component';
import { AccountComponent } from './features/nutricionist/account/account.component';
import { DashboardNutricionistaComponent } from './features/nutricionist/dashboard-nutricionista/dashboard-nutricionista.component';
import { GoalsNutricionistComponent } from './features/nutricionist/goals-nutricionist/goals-nutricionist.component';
import { NutriScheduleComponent } from './features/nutricionist/nutri-schedule/nutri-schedule.component';
import { NutritionPlanFormComponent } from './features/nutricionist/nutrition-plan-form/nutrition-plan-form.component';
import { LoyaltyCardNutricionistComponent } from './features/nutricionist/loyalty-card-nutricionist/loyalty-card-nutricionist.component';
import { AdminClientsComponent } from './features/admin/admin-clients/admin-clients.component';

export const routes: Routes = [

  { path: 'login', component: LoginComponent, canActivate: [LoginRedirectGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [LoginRedirectGuard] },
  { path: 'reset-password', component: ResetPasswordRequestComponent, canActivate: [LoginRedirectGuard] },

  // Doble factor
  { path: 'auth-verify', component: AuthVerifyComponent, canActivate: [twoFactorGuard] },


  {
    path: '',
    canActivate: [authGuard],
    children: [
      // CLIENTE
      {
        path: '',
        component: DashboardComponent,
        pathMatch: 'full',
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },
      {
        path: 'profile',
        component: PersonalrecordComponent,
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },
      {
        path: 'appoinments',
        component: AppointmentsComponent,
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },
      {
        path: 'client-plan',
        component: ClientNutritionPlansComponent,
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },
      {
        path: 'goals',
        component: GoalsComponent,
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },
      {
        path: 'loyaltycard',
        component: LoyaltyCardClientComponent,
        canActivate: [roleGuard],
        data: { role: 'cliente' }
      },

      // NUTRICIONISTA
      {
        path: 'dashboard-nutricionista',
        component: DashboardNutricionistaComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },
      {
        path: 'nutri-schedule',
        component: NutriScheduleComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },
      {
        path: 'nutri-plan',
        component: NutritionPlanFormComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },
      {
        path: 'goals-nutricionist',
        component: GoalsNutricionistComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },
      {
        path: 'account',
        component: AccountComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },
      {
        path: 'loyalty-card-nutricionist',
        component: LoyaltyCardNutricionistComponent,
        canActivate: [roleGuard],
        data: { role: 'nutricionista' }
      },

      // ADMIN
      {
        path: 'admin-clients',
        component: AdminClientsComponent,
        canActivate: [roleGuard],
        data: { role: 'admin' }
      },

      // CAMBIO DE CONTRASEÑA
      {
        path: 'changepassword',
        component: ChangePasswordComponent,
        canActivate: [authGuard]
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
