import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { BaseLayoutComponent } from './layouts/base/base.layout';
import { PageComponent } from './layouts/page/page.component';
import { HeaderComponent } from './navigation/header/header.component';
import { SideMenuComponent } from './navigation/side-menu/side-menu.component';

const APP_SHELL_COMPONENTS = [
  BaseLayoutComponent,
  PageComponent,
  HeaderComponent,
  SideMenuComponent
];

@NgModule({
  declarations: APP_SHELL_COMPONENTS,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: APP_SHELL_COMPONENTS
})
export class AppShellModule {}
