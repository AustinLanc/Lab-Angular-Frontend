import { Routes } from '@angular/router';
import { Qc } from './qc/qc';
import { Reminders } from './reminders/reminders';
import { Results } from './results/results';
import { Retains } from  './retains/retains';
import { Update } from './update/update';
import { Production } from './production/production';
import { Login } from './login/login';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: Login, data: { title: 'Login' } },
    { path: '', redirectTo: '/update', pathMatch: 'full' },
    { path: 'qc', component: Qc, data: { title: 'QC Logs' }, canActivate: [authGuard] },
    { path: 'reminders', component: Reminders, data: { title: 'Batch Reminders' }, canActivate: [authGuard] },
    { path: 'results', component: Results, data: { title: 'Test Results' }, canActivate: [authGuard] },
    { path: 'retains', component: Retains, data: { title: 'Available Retains' }, canActivate: [authGuard] },
    { path: 'update', component: Update, data: { title: 'Update Retain Records' }, canActivate: [authGuard] },
    { path: 'production', component: Production, data: { title: 'Production Stats' }, canActivate: [authGuard] },
    { path: '**', redirectTo: '/' },
];
