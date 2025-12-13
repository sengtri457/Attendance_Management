import { Routes } from "@angular/router";

export const LEAVE_ROUTES: Routes = [
  {
    path: "request",
    // pathMatch: "full",
    loadComponent: () =>
      import("./student-leave-request.component/student-leave-request.component").then(
        (m) => m.StudentLeaveRequestComponent,
      ),
    // canActivate: [authGuardGuard],
  },
  {
    path: "review",
    loadComponent: () =>
      import("./leave-review.component/leave-review.component").then(
        (m) => m.LeaveReviewComponent,
      ),
    // canActivate: [authGuardGuard],
  },
  {
    path: "new",
    loadComponent: () =>
      import("./leave-request-form.component/leave-request-form.component").then(
        (m) => m.LeaveRequestFormComponent,
      ),
    // canActivate: [authGuardGuard],
  },
];
