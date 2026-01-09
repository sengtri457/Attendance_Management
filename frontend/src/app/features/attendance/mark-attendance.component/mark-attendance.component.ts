import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/studentservices/student.service';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { Student, Teacher } from '../../../models/user.model';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-mark-attendance.component',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './mark-attendance.component.html',
  styleUrl: './mark-attendance.component.css',
})
export class MarkAttendanceComponent implements OnInit {
  attendanceForm: FormGroup;
  loading = false;
  success = false;
  error = '';
  loadingStudents = false;
  loadingTeachers = false;
  students: Student[] = [];
  teachers: Teacher[] = [];

  // Search functionality
  studentSearchTerm = '';
  teacherSearchTerm = '';
  filteredStudents: Student[] = [];
  filteredTeachers: Teacher[] = [];
  showStudentDropdown = false;
  showTeacherDropdown = false;
  selectedStudent: Student | null = null;
  selectedTeacher: Teacher | null = null;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private router: Router
  ) {
    this.attendanceForm = this.fb.group({
      studentId: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      checkInTime: [new Date().toISOString().slice(0, 16), Validators.required],
      checkOutTime: [''],
      markedByTeacherId: ['', Validators.required],
      note: [''],
    });
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadTeachers();
  }

  backToDashboard() {
    this.router.navigateByUrl('/attendance');
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.students = response.data || response;
        this.filteredStudents = this.students;
        this.loadingStudents = false;
      },
      error: (error) => {
        console.error('Failed to load students:', error);
        this.loadingStudents = false;
      },
    });
  }

  loadTeachers(): void {
    this.loadingTeachers = true;
    this.teacherService.getAll().subscribe({
      next: (response) => {
        this.teachers = response.data || response;
        this.filteredTeachers = this.teachers;
        this.loadingTeachers = false;
      },
      error: (error) => {
        console.error('Failed to load teachers:', error);
        this.loadingTeachers = false;
      },
    });
  }

  // Student search methods
  onStudentSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.studentSearchTerm = input.value;
    this.filterStudents();
    this.showStudentDropdown = true;
  }

  filterStudents(): void {
    const term = this.studentSearchTerm.toLowerCase();
    this.filteredStudents = this.students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        student._id.toString().includes(term) ||
        (student.user.email && student.user.email.toLowerCase().includes(term))
      );
    });
  }

  selectStudent(student: Student): void {
    this.selectedStudent = student;
    this.studentSearchTerm = `${student.firstName} ${student.lastName}`;
    this.attendanceForm.patchValue({ studentId: student._id });
    this.showStudentDropdown = false;
  }

  // Teacher search methods
  onTeacherSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.teacherSearchTerm = input.value;
    this.filterTeachers();
    this.showTeacherDropdown = true;
  }

  filterTeachers(): void {
    const term = this.teacherSearchTerm.toLowerCase();
    this.filteredTeachers = this.teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(term) ||
        teacher._id.toString().includes(term) ||
        (teacher.user.email && teacher.user.email.toLowerCase().includes(term))
    );
  }

  selectTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.teacherSearchTerm = teacher.name;
    this.attendanceForm.patchValue({ markedByTeacherId: teacher._id });
    this.showTeacherDropdown = false;
  }

  resetForm(): void {
    this.attendanceForm.reset({
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toISOString().slice(0, 16),
    });
    this.studentSearchTerm = '';
    this.teacherSearchTerm = '';
    this.selectedStudent = null;
    this.selectedTeacher = null;
    this.showStudentDropdown = false;
    this.showTeacherDropdown = false;
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) {
      return;
    }
    this.loading = true;
    this.success = false;
    this.error = '';
    const formValue = this.attendanceForm.value;
    const data = {
      studentId: formValue.studentId,
      date: formValue.date,
      checkInTime: new Date(formValue.checkInTime).toISOString(),
      checkOutTime: formValue.checkOutTime
        ? new Date(formValue.checkOutTime).toISOString()
        : undefined,
      markedByTeacherId: formValue.markedByTeacherId,
      note: formValue.note,
    };
    this.attendanceService.mark(data).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;

        // Reset form and search fields
        this.resetForm();

        // Show appropriate message based on attendance status
        if (response.data.isLate && response.data.lateBy > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Late Arrival',
            text: `Student was ${response.data.lateBy} minutes late!`,
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'On Time',
            text: 'Student was on time!',
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to mark attendance';
      },
    });
  }
}
