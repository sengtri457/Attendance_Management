import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { StudentService } from "../../../services/studentservices/student.service";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { QRCodeComponent } from 'angularx-qrcode';
import {
  Attendance,
  PaginationResponse,
  Student,
} from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../services/authservice/auth.service";

@Component({
  selector: "app-student-detail.component",
  imports: [CommonModule, FormsModule, RouterModule, QRCodeComponent],
  templateUrl: "./student-detail.component.html",
  styleUrl: "./student-detail.component.css",
})
export class StudentDetailComponent {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private router = inject(Router);
  im: any[] = [];
  loading = true;

  page = 1;
  limit = 10;
  stats: any = null;
  student: Student | null = null;
  parents: any[] = [];
  attendanceRecords: Attendance[] = [];
  // loading = true;
  loadingAttendance = true;
  canEdit = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadStudent(id);
      this.loadParents(id);
      this.loadAttendance(id);
      this.loadStats(id);

      // Check if user can edit
      const currentUser = this.authService.getCurrentUser();
      this.canEdit =
        currentUser && ["Admin", "Teacher"].includes(currentUser.role);
    }
  }

  loadStudent(id: string): void {
    this.studentService.getById(id).subscribe({
      next: (response) => {
        this.student = response.data;
        console.log(this.student);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading student:", error);
        this.loading = false;
      },
    });
  }

  loadParents(id: string): void {
    this.studentService.getParents(id).subscribe({
      next: (response) => {
        this.parents = response.data;
      },
      error: (error) => {
        console.error("Error loading parents:", error);
      },
    });
  }


  groupedAttendance: any[] = [];

  loadAttendance(id: string): void {
    this.attendanceService.getAll({ studentId: id }).subscribe({
      next: (response) => {
        this.attendanceRecords = response.data;
        this.processGroupedAttendance();
        this.loadingAttendance = false;
      },
      error: (error) => {
        console.error("Error loading attendance:", error);
        this.loadingAttendance = false;
      },
    });
  }

  processGroupedAttendance() {
    const groups = new Map<string, any>();

    this.attendanceRecords.forEach((att) => {
      const dateKey = new Date(att.date).toDateString(); // Group by date string
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: att.date,
          records: [],
          status: "present", // Default
          checkInTime: null,
          checkOutTime: null,
          isLate: false
        });
      }

      const group = groups.get(dateKey);
      group.records.push(att);
    });

    // Calculate daily status priority for each group
    this.groupedAttendance = Array.from(groups.values()).map((group) => {
      const statuses = group.records.map((r: any) => r.status);
      
      let dailyStatus = "present";
      let isLate = false;
      let checkInTime = null;

      if (statuses.includes("absent")) {
          dailyStatus = "absent";
      } else if (statuses.includes("on-leave")) {
          dailyStatus = "on-leave";
      } else if (statuses.includes("late")) {
          dailyStatus = "late";
          isLate = true;
      } else if (statuses.includes("half-day")) {
          dailyStatus = "half-day";
      }

      // Find earliest check-in time for the display
      const checkIns = group.records
          .filter((r: any) => r.checkInTime)
          .map((r: any) => new Date(r.checkInTime).getTime());
      
      if (checkIns.length > 0) {
          checkInTime = new Date(Math.min(...checkIns));
      }

      group.status = dailyStatus;
      group.isLate = isLate;
      group.checkInTime = checkInTime;
      
      // Sort records by time if needed, or just keep them
      return group;
    });
    
    // Sort groups by date descending
    this.groupedAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log(this.groupedAttendance);
  }

  loadStats(id: string): void {
    this.attendanceService.getStudentStats(id).subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error("Error loading stats:", error);
      },
    });
  }
}
