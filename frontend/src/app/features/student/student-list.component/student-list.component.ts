import { Component, OnInit, inject } from '@angular/core';
import { StudentService } from '../../../services/studentservices/student.service';
import { Student } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-student-list.component',
  imports: [CommonModule, RouterModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css',
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  students: Student[] = [];
  loading = true;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  currentUser: any;
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current User:', this.currentUser);
    this.checkPermissions();
    this.loadStudents();
    if (this.authService.isStudent()) {
      const studentId = this.authService.getStudentId();
      this.router.navigate(['/students', studentId]);
      // Redirects to their profile only!
    }
  }

  checkPermissions() {
    const currentUser = this.authService.getCurrentUser();
    console.log(currentUser);
    if (currentUser) {
      this.canCreate = currentUser.role === 'Admin';
      this.canEdit = ['Admin', 'Teacher'].includes(currentUser.role);
      this.canDelete = currentUser.role === 'Admin';
    }
  }

  loadStudents(): void {
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.students = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.loading = false;
      },
    });
  }

  deleteStudent(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to blacklist this student?')) {
      this.studentService.delete(id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error deleting student:', error);
          alert('Failed to delete student');
        },
      });
    }
  }
}
