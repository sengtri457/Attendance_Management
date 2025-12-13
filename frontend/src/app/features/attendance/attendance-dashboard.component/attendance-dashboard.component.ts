import { Component, OnInit } from "@angular/core";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { Attendance, TodayAttendanceSummary } from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/authservice/auth.service";
import { LeaveRequestService } from "../../../services/leaveRequestservice/leave-request.service";

@Component({
  selector: "app-attendance-dashboard.component",
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: "./attendance-dashboard.component.html",
  styleUrl: "./attendance-dashboard.component.css",
})
export class AttendanceDashboardComponent implements OnInit {
  summary: TodayAttendanceSummary = {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
  };
  todayAttendance: any[] = [];
  loading = false;
  currentDate = new Date();
  countLeave: any[] = [];
  constructor(
    public attendanceService: AttendanceService,
    public auth: AuthService,
    private router: Router,
    private leaveService: LeaveRequestService,
  ) {}

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadCountLeave();
  }
  leaveRequest() {
    this.router.navigateByUrl("leave/request");
  }
  loadCountLeave() {
    this.leaveService.getAll().subscribe({
      next: (response) => {
        this.countLeave = response.data;
        console.log("Count of leave requests:", this.countLeave.length);
      },
      error: (error) => {
        console.error("Error loading count of leave requests:", error);
      },
    });
  }

  loadTodayAttendance(): void {
    this.loading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.todayAttendance = response.data;
        console.log(this.todayAttendance);
        console.log("Today's attendance:", this.todayAttendance);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading today's attendance:", error);
        this.loading = false;
      },
    });
  }

  getAttendanceRate(): number {
    if (this.summary.total === 0) return 0;
    return Math.round(
      ((this.summary.present + this.summary.onLeave) / this.summary.total) *
        100,
    );
  }

  getPunctualityRate(): number {
    if (this.summary.present === 0) return 0;
    return Math.round(
      ((this.summary.present - this.summary.late) / this.summary.present) * 100,
    );
  }
}
