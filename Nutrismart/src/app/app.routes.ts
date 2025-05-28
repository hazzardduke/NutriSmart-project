import { Routes } from '@angular/router';
import { RegisterComponent } from './core/register/register.component';
import { LoginComponent } from './core/login/login.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '**',    redirectTo: '' }
];
