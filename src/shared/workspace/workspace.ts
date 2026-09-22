import { Injectable, signal } from '@angular/core';
export const SAMPLE = JSON.stringify(
  {
    name: 'A little more local',
    version: '1.0.0',
    private: true,
    description: 'Good tools. No round trips.',
    workspace: { theme: 'moss', autosave: false, indentation: 2 },
    favorites: ['JSON Formatter', 'JSONPath', 'JSON → YAML'],
    madeFor: 'the everyday developer',
    dependencies: null,
  },
  null,
  2,
);
@Injectable({ providedIn: 'root' })
export class Workspace {
  // Memory only: closing the tab discards potentially sensitive documents.
  readonly input = signal(SAMPLE);
  readonly output = signal(SAMPLE);
  readonly language = signal('json');
}
