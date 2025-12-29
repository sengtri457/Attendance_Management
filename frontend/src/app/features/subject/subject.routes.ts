import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard-guard';

export const SUBJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./subject.component/subject.component').then(
        (m) => m.SubjectComponent
      ),
    canActivate: [roleGuard(['Admin', 'Teacher'])],
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./subject-form.component/subject-form.component').then(
        (m) => m.SubjectFormComponent
      ),
    canActivate: [roleGuard(['Admin'])],
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./subject-form.component/subject-form.component').then(
        (m) => m.SubjectFormComponent
      ),
    canActivate: [roleGuard(['Admin'])],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./subject-form.component/subject-form.component').then(
        (m) => m.SubjectFormComponent
      ),
  },
];
