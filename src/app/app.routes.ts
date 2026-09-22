import type { Routes } from '@angular/router';

// Each section of lurtins.com loads on demand, e.g. /tools now and /games later.
export const routes: Routes = [
  // Until the resume lives at the root, send visitors to the tools.
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  {
    path: 'tools',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'json/viewer' },
      {
        path: '',
        loadChildren: () =>
          import('../features/json/json.routes').then((module) => module.JSON_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'tools' },
];
