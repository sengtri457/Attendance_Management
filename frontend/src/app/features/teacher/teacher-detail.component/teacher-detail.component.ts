import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { Teacher } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-detail.component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.css',
})
export class TeacherDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private authService = inject(AuthService);

  teacher: Teacher | null = null;
  subjects: any[] = [];
  loading = true;
  loadingSubjects = true;
  canEdit = false;
  isTeacherUser = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Check if teacher is viewing their own profile
      const currentUser = this.authService.getCurrentUser();
      const teacherId = this.authService.getTeacherId();

      this.isTeacherUser = currentUser?.role === 'Teacher';

      if (this.isTeacherUser && teacherId && id !== teacherId) {
        this.router.navigate(['/teachers', teacherId]);
        return;
      }

      this.loadTeacher(id);
      this.loadSubjects(id);
    }

    const user = this.authService.getCurrentUser();
    this.canEdit = user && user.role === 'Admin';
  }

  loadTeacher(id: string): void {
    this.teacherService.getById(id).subscribe({
      next: (response) => {
        this.teacher = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teacher:', error);
        this.loading = false;
      },
    });
  }

  loadSubjects(id: string): void {
    this.teacherService.getSubjects(id).subscribe({
      next: (response) => {
        this.subjects = response.data;
        console.log('Loaded subjects:', this.subjects);
        this.loadingSubjects = false;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.loadingSubjects = false;
      },
    });
  }

  getThisWeekSubjects(): number {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    return this.subjects.filter((s) => {
      if (!s.teachTime) return false;
      const date = new Date(s.teachTime);
      return date >= weekStart && date <= weekEnd;
    }).length;
  }
}
