import { Routes } from '@angular/router';
import { ClassGroupListComponent } from './class-group-list/class-group-list.component';
import { ClassGroupFormComponent } from './class-group-form/class-group-form.component';
import { ClassGroupDetailComponent } from './class-group-detail/class-group-detail.component';


export const classGroupRoutes: Routes = [
  {
    path: '',
    component: ClassGroupListComponent
  },
  {
    path: 'create',
    component: ClassGroupFormComponent
  },
  {
    path: 'edit/:id',
    component: ClassGroupFormComponent
  },
  {
    path: 'students/:id',
    component: ClassGroupDetailComponent
  }
];
