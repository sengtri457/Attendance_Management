import { Routes } from "@angular/router";
import { roleGuard } from "../../core/guards/auth.guard-guard";

export const STUDENT_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./student-list.component/student-list.component").then(
        (m) => m.StudentListComponent,
      ),
  },
  {
    path: "create",
    loadComponent: () =>
      import("./student-form.component/student-form.component").then(
        (m) => m.StudentFormComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: "restore/:id",
    loadComponent: () =>
      import("./student-form.component/student-form.component").then(
        (m) => m.StudentFormComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: "blacklist",
    loadComponent: () =>
      import("../black-list.component/black-list.component").then(
        (m) => m.BlackListComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: "edit/:id",
    loadComponent: () =>
      import("./student-form.component/student-form.component").then(
        (m) => m.StudentFormComponent,
      ),
    canActivate: [roleGuard(["Admin", "Teacher"])],
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./student-detail.component/student-detail.component").then(
        (m) => m.StudentDetailComponent,
      ),
    canActivate: [roleGuard(["Admin", "Teacher", "Student"])],
  },
];
