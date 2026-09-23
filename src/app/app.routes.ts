import type { Routes } from '@angular/router';

// Each section of lurtins.com loads on demand, e.g. /tools now and /games later.
export const routes: Routes = [
  // Until the resume lives at the root, send visitors to the tools.
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  {
    path: 'tools',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'json/viewer' },
      { path: 'yaml', pathMatch: 'full', redirectTo: 'yaml/viewer' },
      {
        path: 'yaml/:slug',
        loadComponent: () =>
          import('../features/yaml/ui/yaml-workspace').then((module) => module.YamlWorkspace),
      },
      { path: 'data', pathMatch: 'full', redirectTo: 'data/generator' },
      {
        path: 'data/generator',
        loadComponent: () =>
          import('../features/data/ui/data-workspace').then((module) => module.DataWorkspace),
      },
      {
        path: '',
        loadChildren: () =>
          import('../features/json/json.routes').then((module) => module.JSON_ROUTES),
      },
    ],
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('../features/legal/privacy-page').then((module) => module.PrivacyPage),
  },
  { path: '**', redirectTo: 'tools' },
];
