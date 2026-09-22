import { Injectable, signal } from '@angular/core';
import { SAMPLE } from '../samples/json-samples';
@Injectable({ providedIn: 'root' })
export class Workspace {
  // Memory only: closing the tab discards potentially sensitive documents.
  readonly input = signal(SAMPLE);
  readonly output = signal(SAMPLE);
  readonly language = signal('json');
}
