import { Routes } from '@angular/router';

// Guards
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { twoFactorGuard } from './guards/two-factor.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard'; // 👈 nuevo guard

// Core
import { LoginComponent } from './core/login/login.component';
import { RegisterComponent } from './core/register/register.component';
import { ResetPasswordRequestComponent } from './reset-password-request/reset-password-request.component';
import { ChangePasswordComponent } from './core/changepassword/changepassword.component';
import { AuthVerifyComponent } from './core/auth-verify/auth-verify.component';

// Cliente
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonalrecordComponent } from './core/client/personalrecord/personalrecord.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { GoalsComponent } from './features/goals/goals.component';
import { LoyaltyCardClientComponent } from './loyalty-card-client/loyalty-card-client.component';
import { ClientNutritionPlansComponent } from './features/client-nutrition-plans/client-nutrition-plans.component';

// Nutricionista
import { DashboardNutricionistaComponent } from './features/dashboard-nutricionista/dashboard-nutricionista.component';
import { NutriScheduleComponent } from './features/nutri-schedule/nutri-schedule.component';
import { NutritionPlanFormComponent } from './features/nutrition-plan-form/nutrition-plan-form.component';
import { GoalsNutricionistComponent } from './features/goals-nutricionist/goals-nutricionist.component';
import { AccountComponent } from './features/account/account.component';
import { LoyaltyCardNutricionistComponent } from './loyalty-card-nutricionist/loyalty-card-nutricionist.component';

// Admin
import { AdminClientsComponent } from './admin-clients/admin-clients.component';

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
