import { Component, inject, OnInit } from '@angular/core';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Teacher } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
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
  // Pagination
  currentPage = 1;
  totalPages = 0;
  totalCount = 0;
  limit = 10;
  selectedLimit = 10;

  // Search
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Sorting
  selectedSort = 'name-asc'; // Sort by name by default
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  Math = Math;

  ngOnInit(): void {
    // If teacher user, redirect to their profile
    if (this.authService.isTeacher()) {
      const teacherId = this.authService.getTeacherId();
      if (teacherId) {
        this.router.navigate(['/teachers', teacherId]);
        return;
      }
    }
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTeachers();
      });
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

  loadTeachers() {
    this.loading = true;

    this.teacherService
      .getAll({
        page: this.currentPage,
        limit: this.limit,
        search: this.searchTerm,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      })
      .subscribe({
        next: (response: any) => {
          this.teachers = response.data;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalCount = response.pagination.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading teachers:', error);
          this.loading = false;
        },
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadTeachers();
  }

  onLimitChange() {
    this.limit = this.selectedLimit;
    this.currentPage = 1;
    this.loadTeachers();
  }

  onSortChange() {
    const [sortBy, sortOrder] = this.selectedSort.split('-');
    this.sortBy = sortBy;
    this.sortOrder = sortOrder as 'asc' | 'desc';
    this.loadTeachers();
  }

  goToPage(page: any) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTeachers();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTeachers();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTeachers();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxPages = 5;

    if (this.totalPages <= maxPages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      pages.push(this.totalPages);
    }

    return pages;
  }

  deleteTeacher(id: string, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.teacherService.delete(id).subscribe({
          next: () => {
            this.loadTeachers();
          },
          error: (error) => {
            console.error('Error deleting teacher:', error);
            alert(error.error?.message || 'Failed to delete teacher');
          },
        });
        Swal.fire({
          title: 'Deleted!',
          text: 'Your Teacher has been deleted.',
          icon: 'success',
        });
      }
    });
  }
}
