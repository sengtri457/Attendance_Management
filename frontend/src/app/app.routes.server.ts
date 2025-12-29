import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'students/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'students/restore/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'students/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'parents/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'parents/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'subjects/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'subjects/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'teachers/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'teachers/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'attendance/stats/:studentId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'attendance/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
