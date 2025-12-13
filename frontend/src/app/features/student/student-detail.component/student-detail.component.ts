import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { StudentService } from "../../../services/studentservices/student.service";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
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
  imports: [CommonModule, FormsModule, RouterModule],
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

      // Check if user can edit
      const currentUser = this.authService.getCurrentUser();
      this.canEdit =
        currentUser && ["Admin", "Teacher"].includes(currentUser.role);
      // // If student tries to view another student's profile
      // if (currentUser?.role === 'Student' && id !== studentId) {
      //   this.router.navigate(['/students', studentId]);
      //   // Redirects back to their own profile!
      // }
    }
  }

  loadStudent(id: string): void {
    this.studentService.getById(id).subscribe({
      next: (response) => {
        this.student = response.data;
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
        console.log(this.parents);
      },
      error: (error) => {
        console.error("Error loading parents:", error);
      },
    });
  }

  loadAttendance(id: string): void {
    this.attendanceService.getAll({ studentId: id }).subscribe({
      next: (response) => {
        this.attendanceRecords = response.data;
        this.loadingAttendance = false;
      },
      error: (error) => {
        console.error("Error loading attendance:", error);
        this.loadingAttendance = false;
      },
    });
  }

  getPresentCount(): number {
    return this.attendanceRecords.filter((r) => r.checkInTime).length;
  }

  getAbsentCount(): number {
    return this.attendanceRecords.filter((r) => !r.checkInTime).length;
  }
}
