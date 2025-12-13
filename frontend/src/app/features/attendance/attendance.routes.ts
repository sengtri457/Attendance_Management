import { Routes } from "@angular/router";
import { roleGuard } from "../../core/guards/auth.guard-guard";

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./attendance-dashboard.component/attendance-dashboard.component").then(
        (m) => m.AttendanceDashboardComponent,
      ),
    canActivate: [roleGuard(["Admin", "Teacher"])],
  },
  {
    path: "list",
    loadComponent: () =>
      import("./attendance-list.component/attendance-list.component").then(
        (m) => m.AttendanceListComponent,
      ),
  },
  {
    path: "stats/:studentId",
    loadComponent: () =>
      import("./attendance-stats.component/attendance-stats.component").then(
        (m) => m.AttendanceStatsComponent,
      ),
  },
  {
    path: "mark",
    loadComponent: () =>
      import("./mark-attendance.component/mark-attendance.component").then(
        (m) => m.MarkAttendanceComponent,
      ),
  },
  {
    path: "lateReport",
    loadComponent: () =>
      import("../attendance/late-report.component/late-report.component").then(
        (m) => m.LateReportComponent,
      ),
  },
  {
    path: "absenteeReport",
    loadComponent: () =>
      import("./absent-report.component/absent-report.component").then(
        (m) => m.AbsentReportComponent,
      ),
  },
  {
    path: "mark-absent",
    loadComponent: () =>
      import("../markmark-absent.component/markmark-absent.component").then(
        (m) => m.MarkmarkAbsentComponent,
      ),
  },
];
