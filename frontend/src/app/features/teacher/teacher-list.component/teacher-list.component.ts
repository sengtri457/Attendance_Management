import { Component, inject, OnInit } from '@angular/core';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Teacher } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-list.component',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.css',
})
export class TeacherListComponent implements OnInit {
  private teacherService = inject(TeacherService);
  private authService = inject(AuthService);
  private router = inject(Router);

  teachers: Teacher[] = [];
  loading = true;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  ngOnInit(): void {
    // If teacher user, redirect to their profile
    if (this.authService.isTeacher()) {
      const teacherId = this.authService.getTeacherId();
      if (teacherId) {
        this.router.navigate(['/teachers', teacherId]);
        return;
      }
    }

    this.checkPermissions();
    this.loadTeachers();
  }

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreate = user.role === 'Admin';
      this.canEdit = user.role === 'Admin';
      this.canDelete = user.role === 'Admin';
    }
  }

  loadTeachers(): void {
    this.teacherService.getAll().subscribe({
      next: (response) => {
        this.teachers = response.data;
        console.log('Loaded teachers:', this.teachers);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.loading = false;
      },
    });
  }

  deleteTeacher(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this teacher?')) {
      this.teacherService.delete(id).subscribe({
        next: () => {
          this.loadTeachers();
        },
        error: (error) => {
          console.error('Error deleting teacher:', error);
          alert(error.error?.message || 'Failed to delete teacher');
        },
      });
    }
  }
}
