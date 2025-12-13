import { Component, inject, OnInit } from "@angular/core";
import { AuthService } from "../../../services/authservice/auth.service";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { StudentService } from "../../../services/studentservices/student.service";
import {
  Attendance,
  Parent,
  Student,
  Teacher,
} from "../../../models/user.model";
import { TeacherService } from "../../../services/teacherservice/teacher.service";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { ParentService } from "../../../services/parentservice/parent.service";
@Component({
  selector: "app-dashboardcomponent",
  imports: [FormsModule, RouterModule, CommonModule, RouterLink],
  templateUrl: "./dashboardcomponent.html",
  styleUrl: "./dashboardcomponent.css",
})
export class Dashboardcomponent implements OnInit {
  // Inject services
  private authService = inject(AuthService);
  private router = inject(Router);
  private studentservice = inject(StudentService);
  private teacherService = inject(TeacherService);
  private attendanceService = inject(AttendanceService);
  private parentService = inject(ParentService);

  // User and role information
  currentUser: any;
  isStudent = false;
  isTeacher = false;
  isParent = false;
  isAdmin = false;

  // IDs for different roles
  studentId: string | null = null;
  teacherId: string | null = null;
  parentId: string | null = null;

  // Data arrays for admin dashboard
  students: any[] = [];
  teacher: any[] = [];
  parents: any[] = [];
  attendance: any[] = [];

  // Student specific information
  studentSpecificInformation: any;

  ngOnInit(): void {
    // Get current user and role information
    this.currentUser = this.authService.getCurrentUser();
    this.isStudent = this.authService.isStudent();
    this.isTeacher = this.authService.isTeacher();
    this.isParent = this.authService.isParent();
    this.isAdmin = this.authService.isAdmin();

    // Get role-specific IDs
    this.studentId = this.authService.getStudentId();
    this.teacherId = this.authService.getTeacherId();
    this.parentId = this.authService.getParentId();

    console.log("Current User:", this.currentUser);
    console.log("Student ID:", this.studentId);
    console.log("Teacher ID:", this.teacherId);
    console.log("Parent ID:", this.parentId);
    console.log("Is Admin:", this.isAdmin);

    // Load data based on role
    if (this.isStudent && this.studentId) {
      this.loadStudentDashboard();
    } else if (this.isTeacher || this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isParent && this.parentId) {
      this.loadParentDashboard();
    }
  }

  // Student Dashboard - Load student specific info
  loadStudentDashboard(): void {
    if (this.studentId) {
      this.studentservice.getById(this.studentId).subscribe({
        next: (response: any) => {
          this.studentSpecificInformation = response;
          console.log("Student Info:", this.studentSpecificInformation);
        },
        error: (error) => {
          console.error("Error loading student info:", error);
        },
      });
    }
  }

  // Admin Dashboard - Load all counts
  loadAdminDashboard(): void {
    this.countStudents();
    this.countTeachers();
    this.countParents();
    this.countAttendance();
  }

  // Parent Dashboard
  loadParentDashboard(): void {
    // Implement parent-specific logic if needed
    console.log("Loading parent dashboard...");
  }

  // Count all students
  countStudents(): void {
    this.studentservice.getAll().subscribe({
      next: (response: any) => {
        this.students = response.data;
        console.log("Total Students:", this.students.length);
      },
      error: (error) => {
        console.error("Error loading students:", error);
      },
    });
  }

  // Count all teachers
  countTeachers(): void {
    this.teacherService.getAll().subscribe({
      next: (response: any) => {
        this.teacher = response.data;
        console.log("Total Teachers:", this.teacher.length);
      },
      error: (error) => {
        console.error("Error loading teachers:", error);
      },
    });
  }

  // Count all parents
  countParents(): void {
    this.parentService.getAll().subscribe({
      next: (response: any) => {
        this.parents = response.data;
        console.log("Total Parents:", this.parents.length);
      },
      error: (error) => {
        console.error("Error loading parents:", error);
      },
    });
  }

  // Count all attendance records
  countAttendance(): void {
    this.attendanceService.getAll().subscribe({
      next: (response: any) => {
        this.attendance = response.data;
        console.log("Total Attendance Records:", this.attendance.length);
      },
      error: (error) => {
        console.error("Error loading attendance:", error);
      },
    });
  }

  // Review and approve leave requests (Admin only)
  reviewApprove(): void {
    this.router.navigate(["/leave-requests"]);
  }
}
