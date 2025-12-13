import { Routes } from "@angular/router";
import { roleGuard } from "../../core/guards/auth.guard-guard";

export const PARENT_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./parent-list.component/parent-list.component").then(
        (m) => m.ParentListComponent,
      ),
  },
  {
    path: "create",
    loadComponent: () =>
      import("./parent-form.component/parent-form.component").then(
        (m) => m.ParentFormComponent,
      ),
    canActivate: [roleGuard(["Admin"])],
  },
  {
    path: "edit/:id",
    loadComponent: () =>
      import("./parent-form.component/parent-form.component").then(
        (m) => m.ParentFormComponent,
      ),
    canActivate: [roleGuard(["Admin", "Teacher"])],
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./parent-detail.component/parent-detail.component").then(
        (m) => m.ParentDetailComponent,
      ),
  },
];
