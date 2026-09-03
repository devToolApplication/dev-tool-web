import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@shared/shared.module';

import { accountManagementRoutes } from './account-management.routes';
import { AccountListComponent } from './pages/account-list/account-list.component';

@NgModule({
  declarations: [AccountListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(accountManagementRoutes),
    SharedModule,
  ],
  exports: [AccountListComponent],
})
export class AccountManagementModule {}