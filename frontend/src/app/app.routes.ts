import { Routes } from '@angular/router';
import { authGuardGuard, guestGuard } from './core/guards/auth.guard-guard';
import { LeaveRequestFormComponent } from './features/leave/leave-request-form.component/leave-request-form.component';
import { LeaveApproveComponent } from './features/leave/leave-approve.component/leave-approve.component';
import { SubjectComponent } from './features/subject/subject.component/subject.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    canActivate: [guestGuard],
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'newLeave',
    component: LeaveRequestFormComponent,
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboardcomponent/dashboardcomponent').then(
        (m) => m.Dashboardcomponent
      ),
    canActivate: [authGuardGuard],
  },
  {
    path: 'students',
    loadChildren: () =>
      import('./features/student/student.routes').then((m) => m.STUDENT_ROUTES),
    canActivate: [authGuardGuard],
  },
  {
    path: 'parents',
    loadChildren: () =>
      import('./features/parents/parent.routes').then((m) => m.PARENT_ROUTES),
    canActivate: [authGuardGuard],
  },
  {
    path: 'subjects',
    loadChildren: () =>
      import('./features/subject/subject.routes').then((m) => m.SUBJECT_ROUTES),
    canActivate: [authGuardGuard],
  },
  {
    path: 'teachers',
    loadChildren: () =>
      import('./features/teacher/teacher.routes').then((m) => m.TEACHER_ROUTES),
    canActivate: [authGuardGuard],
  },
  {
    path: 'attendance',
    loadChildren: () =>
      import('./features/attendance/attendance.routes').then(
        (m) => m.ATTENDANCE_ROUTES
      ),
    canActivate: [authGuardGuard],
  },
  {
    path: 'leave',
    loadChildren: () =>
      import('./features/leave/leave.routes').then((m) => m.LEAVE_ROUTES),
    // canActivate: [authGuardGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuardGuard],
  },
  {
    path: 'class-groups',
    loadChildren: () =>
      import('./features/class-group/class-group.routes').then((m) => m.classGroupRoutes),
    canActivate: [authGuardGuard],
  },
];
