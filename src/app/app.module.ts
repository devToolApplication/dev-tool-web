import { APP_INITIALIZER, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutes } from './app.routes';
import { AppComponent } from './app.component';
import { KeycloakService } from './core/auth/keycloak.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { SharedModule } from './shared/shared.module';
import { AuthInterceptor } from './core/http/auth.interceptor';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () => keycloak.init();
}

const AppThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}'
    }
  }
});

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutes,
    SharedModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    MessageService,
    providePrimeNG({
      theme: {
        preset: AppThemePreset,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
