import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { JSON_PROCESSOR } from './features/json/ports/json-processor';
import { BrowserJsonProcessor } from './features/json/infrastructure/browser-json-processor';
bootstrapApplication(App, {
  providers: [{ provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor }],
}).catch(console.error);
