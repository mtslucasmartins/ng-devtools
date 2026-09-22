import { Component } from '@angular/core';
import { JsonWorkspace } from '../features/json/ui/json-workspace';

@Component({ selector: 'app-root', imports: [JsonWorkspace], template: '<app-json-workspace />' })
export class App {}
