import { Routes } from '@angular/router';
import { MailComponent } from './mail.component';

export const mailRoutes: Routes = [
  { path: 'mail', redirectTo: 'mail/inbox', pathMatch: 'full' },
  { path: 'mail/inbox', component: MailComponent },
  { path: 'mail/compose', component: MailComponent }
];
