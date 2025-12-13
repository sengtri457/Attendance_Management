import { Component, OnInit } from "@angular/core";
import { AttendanceService } from "../../services/attendanceservice/attendance.service";
import { Student } from "../../models/user.model";
import { StudentService } from "../../services/studentservices/student.service";
import { AuthService } from "../../services/authservice/auth.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-markmark-absent.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./markmark-absent.component.html",
  styleUrl: "./markmark-absent.component.css",
})
export class MarkmarkAbsentComponent implements OnInit {
  students: Student[] = [];
  selectedDate = "";
  note = "";
  loading = false;
  teacherId: any; // Get from auth service
  results: any[] = [];
  showResults = false;

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.setTodayDate();
    this.teacherId = this.authService.getTeacherId();
  }

  setTodayDate(): void {
    const today = new Date().toISOString().split("T")[0];
    this.selectedDate = today;
  }
  clearSelection(): void {
    this.students.forEach((s) => (s.selected = false));
  }
  loadStudents(): void {
    // Load all students from your service
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.students = response.data.map((s) => ({ ...s, selected: false }));
      },
    });
  }

  toggleAll(event: any): void {
    const checked = event.target.checked;
    this.students.forEach((student) => (student.selected = checked));
  }

  get selectedCount(): number {
    return this.students.filter((s) => s.selected).length;
  }

  get allSelected(): boolean {
    return this.students.length > 0 && this.students.every((s) => s.selected);
  }

  markAbsent(): void {
    const selectedStudentIds = this.students
      .filter((s) => s.selected)
      .map((s) => s._id);

    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student");
      return;
    }

    if (!this.selectedDate) {
      alert("Please select a date");
      return;
    }

    this.loading = true;
    this.attendanceService
      .markAbsent(
        selectedStudentIds,
        this.selectedDate,
        this.teacherId,
        this.note,
      )
      .subscribe({
        next: (response) => {
          this.results = response.results;
          this.showResults = true;
          this.loading = false;

          // Reset selections
          this.students.forEach((s) => (s.selected = false));
          this.note = "";
        },
        error: (error) => {
          console.error("Error marking absent:", error);
          alert("Failed to mark students absent");
          this.loading = false;
        },
      });
  }

  closeResults(): void {
    this.showResults = false;
    this.results = [];
  }
}
