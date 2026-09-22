import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { JSON_PROCESSOR } from './features/json/ports/json-processor';
import { BrowserJsonProcessor } from './features/json/infrastructure/browser-json-processor';
bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    { provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor },
  ],
}).catch(console.error);
