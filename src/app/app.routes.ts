import { Routes } from '@angular/router';
import { Qc } from './qc/qc';
import { Reminders } from './reminders/reminders';
import { Results } from './results/results';
import { Retains } from  './retains/retains';
import { Update } from './update/update';
import { Production } from './production/production';

export const routes: Routes = [
    { path: '', redirectTo: '/update', pathMatch: 'full' },
    { path: 'qc', component: Qc, data: { title: 'QC Logs' } },
    { path: 'reminders', component: Reminders, data: { title: 'Batch Reminders' } },
    { path: 'results', component: Results, data: { title: 'Test Results' } },
    { path: 'retains', component: Retains, data: { title: 'Available Retains' } },
    { path: 'update', component: Update, data: { title: 'Update Retain Records' } },
    { path: 'production', component: Production, data: { title: 'Production Stats' } },
    { path: '**', redirectTo: '/' },
];
