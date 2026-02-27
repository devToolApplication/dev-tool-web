import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutes } from './app.routes';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { SharedModule } from './shared/shared.module';
import { AuthInterceptor } from './core/http/auth.interceptor';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { APP_THEME_PRESETS } from './core/ui-services/theme-presets';
import { KeycloakService } from './core/auth/keycloak.service';

// export function initializeKeycloak(keycloak: KeycloakService) {
//   return () => keycloak.init();
// }

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
    // Để bypass login Keycloak khi dev/demo.
    // Khi cần bật lại, chỉ cần bỏ comment block APP_INITIALIZER bên dưới.
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeKeycloak,
    //   multi: true,
    //   deps: [KeycloakService]
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    MessageService,
    providePrimeNG({
      theme: {
        preset: APP_THEME_PRESETS.aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
