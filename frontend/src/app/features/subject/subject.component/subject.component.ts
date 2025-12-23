import { Component, inject, OnInit } from '@angular/core';
import { SubjectService } from '../../../services/subjectservice/subject.service';
import { HttpClient } from '@angular/common/http';
import {
  CreateSubjectDto,
  Subject,
  UpdateSubjectDto,
} from '../../../models/user.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-subject.component',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.css',
})
export class SubjectComponent implements OnInit {
  subjects: Subject[] = [];
  loading = false;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  error = '';
  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreate = user.role === 'Admin';
      this.canEdit = user.role === 'Admin';
      this.canDelete = user.role === 'Admin';
    }
  }
  constructor(
    private subjectService: SubjectService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading = true;
    this.error = '';

    this.subjectService.getAllSubjects().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjects = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load subjects';
        console.error('Error loading subjects:', err);
        this.loading = false;
      },
    });
  }

  viewSubject(id?: string): void {
    if (id) {
      this.router.navigate(['/subjects', id]);
    }
  }

  editSubject(id?: string): void {
    if (id) {
      this.router.navigate(['/subjects', 'edit', id]);
    }
  }

  deleteSubject(id?: string): void {
    if (!id) return;

    if (confirm('Are you sure you want to delete this subject?')) {
      this.subjectService.deleteSubject(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadSubjects();
          }
        },
        error: (err) => {
          console.error('Error deleting subject:', err);
          alert('Failed to delete subject');
        },
      });
    }
  }

  createNewSubject(): void {
    this.router.navigate(['/subjects', 'create']);
  }
}
