import { Routes } from "@angular/router";
import { roleGuard } from "../../core/guards/auth.guard-guard";

export const TEACHER_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./teacher-list.component/teacher-list.component").then(
        (m) => m.TeacherListComponent,
      ),
  },
  {
    path: "create",
    loadComponent: () =>
      import("./teacher-form.component/teacher-form.component").then(
        (m) => m.TeacherFormComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: "edit/:id",
    loadComponent: () =>
      import("./teacher-form.component/teacher-form.component").then(
        (m) => m.TeacherFormComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./teacher-detail.component/teacher-detail.component").then(
        (m) => m.TeacherDetailComponent,
      ),
  },
];
