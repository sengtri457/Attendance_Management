import { Component, OnInit } from "@angular/core";
import { LeaveRequest, Student } from "../../../models/user.model";
import { LeaveRequestService } from "../../../services/leaveRequestservice/leave-request.service";
import { AuthService } from "../../../services/authservice/auth.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { StudentService } from "../../../services/studentservices/student.service";

@Component({
  selector: "app-student-leave-request.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./student-leave-request.component.html",
  styleUrl: "./student-leave-request.component.css",
})
export class StudentLeaveRequestComponent implements OnInit {
  // Student Selection
  students: Student[] = [];
  filteredStudents: Student[] = [];
  selectedStudent: Student | null = null;
  studentId = "";
  searchTerm = "";

  // Leave Request Form
  fromDate = "";
  toDate = "";
  reason = "";

  // UI States
  loading = false;
  loadingStudents = false;
  submitting = false;
  showSuccessModal = false;
  isTeacher = false;
  isAdmin = false;

  myLeaveRequests: any[] = [];

  constructor(
    private leaveRequestService: LeaveRequestService,
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.setMinDate();
    this.isTeacher = this.authService.isTeacher();
    this.isAdmin = this.authService.isAdmin();
    console.log("isTeacher:", this.isTeacher);
    console.log("isAdmin:", this.isAdmin);
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.students = response.data;
        this.filteredStudents = this.students;
        this.loadingStudents = false;
      },
      error: (error) => {
        console.error("Error loading students:", error);
        this.loadingStudents = false;
      },
    });
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredStudents = this.students;
      return;
    }

    this.filteredStudents = this.students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term) ||
        student.user.email.toLowerCase().includes(term) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(term),
    );

    // If current selected student is not in filtered results, clear selection
    if (
      this.selectedStudent &&
      !this.filteredStudents.find((s) => s._id === this.selectedStudent?._id)
    ) {
      this.studentId = "";
    }
  }

  onStudentChange(event: any): void {
    const selectedId = event.target.value;

    if (!selectedId) {
      this.selectedStudent = null;
      this.studentId = "";
      this.myLeaveRequests = [];
      return;
    }

    this.studentId = selectedId;
    this.selectedStudent =
      this.students.find((s) => s._id === selectedId) || null;

    if (this.selectedStudent) {
      // Update search term to show selected student
      this.searchTerm = `${this.selectedStudent.firstName} ${this.selectedStudent.lastName}`;
      this.loadStudentLeaveRequests();
    }
  }

  clearStudentSelection(): void {
    this.selectedStudent = null;
    this.studentId = "";
    this.searchTerm = "";
    this.myLeaveRequests = [];
    this.filteredStudents = this.students;
  }

  loadStudentLeaveRequests(): void {
    if (!this.studentId) return;

    this.loading = true;
    this.leaveRequestService.getLeaveRequests(this.studentId).subscribe({
      next: (response) => {
        this.myLeaveRequests = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading leave requests:", error);
        this.loading = false;
      },
    });
  }
  leaveNew() {
    this.router.navigateByUrl("/review");
  }
  setMinDate(): void {
    const today = new Date().toISOString().split("T")[0];
    this.fromDate = today;
  }

  submitLeaveRequest(): void {
    // Validation
    if (!this.selectedStudent || !this.studentId) {
      alert("Please select a student first");
      return;
    }

    if (!this.fromDate || !this.toDate || !this.reason.trim()) {
      alert("Please fill in all fields");
      return;
    }

    if (new Date(this.toDate) < new Date(this.fromDate)) {
      alert("End date must be after start date");
      return;
    }

    this.submitting = true;

    const data = {
      studentId: this.studentId,
      fromDate: this.fromDate,
      toDate: this.toDate,
      reason: this.reason.trim(),
    };

    this.leaveRequestService.createLeaveRequest(data).subscribe({
      next: (response) => {
        this.showSuccessModal = true;
        this.submitting = false;

        // Reset form
        this.reason = "";
        this.setMinDate();

        // Reload requests
        this.loadStudentLeaveRequests();

        if (this.isTeacher || this.isAdmin) {
          setTimeout(() => {
            this.router.navigate(["/leave/review"]);
          }, 2000);
        }
      },
      error: (error) => {
        console.error("Error submitting leave request:", error);
        alert(
          "Failed to submit leave request: " +
            (error.error?.message || "Unknown error"),
        );
        this.submitting = false;
      },
    });
  }

  calculateDuration(fromDate: string, toDate: string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "secondary";
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case "approved":
        return "bi-check-circle-fill";
      case "rejected":
        return "bi-x-circle-fill";
      case "pending":
        return "bi-clock-fill";
      default:
        return "bi-question-circle-fill";
    }
  }
}
