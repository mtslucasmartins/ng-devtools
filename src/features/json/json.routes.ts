import type { CanMatchFn, Routes, UrlSegment } from '@angular/router';
import { JSON_TOOLS } from './application/tools';
import { JsonWorkspace } from './ui/json-workspace';

const knownTool: CanMatchFn = (_route, segments: UrlSegment[]) =>
  JSON_TOOLS.some((tool) => tool.path === segments[1]?.path);

/** Mounted under /tools by the app routes. */
export const JSON_ROUTES: Routes = [
  { path: 'json', pathMatch: 'full', redirectTo: 'json/viewer' },
  { path: 'json/convert', redirectTo: 'json/to-yaml' },
  // One route config for every tool so tab changes reuse the workspace and keep its state.
  { path: 'json/:slug', canMatch: [knownTool], component: JsonWorkspace },
];
