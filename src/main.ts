import '@angular/compiler';
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';

(globalThis as { global?: typeof globalThis }).global ??= globalThis;

platformBrowser().bootstrapModule(AppModule, {

})
  .catch(err => console.error(err));
