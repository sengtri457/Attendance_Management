import { Component, inject, OnInit } from '@angular/core';
import { ParentService } from '../../../services/parentservice/parent.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-parent-list.component',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './parent-list.component.html',
  styleUrl: './parent-list.component.css',
})
export class ParentListComponent implements OnInit {
  private parentService = inject(ParentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  parents: any[] = [];
  loading = true;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  currentUser: any;

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
    // If parent user, redirect to their profile
    if (this.authService.isParent()) {
      const parentId = this.authService.getParentId();
      if (parentId) {
        this.router.navigate(['/parents', parentId]);
        return;
      }
    }

    this.checkPermissions();
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadParents();
      });

    this.loadParents();
  }

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreate = user.role === 'Admin';
      this.canEdit = ['Admin', 'Teacher'].includes(user.role);
      this.canDelete = user.role === 'Admin';
    }
  }

  loadParents() {
    this.loading = true;

    this.parentService
      .getAll({
        page: this.currentPage,
        limit: this.limit,
        search: this.searchTerm,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      })
      .subscribe({
        next: (response) => {
          this.parents = response.data;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalCount = response.pagination.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading parents:', error);
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
    this.loadParents();
  }

  onLimitChange() {
    this.limit = this.selectedLimit;
    this.currentPage = 1;
    this.loadParents();
  }

  onSortChange() {
    const [sortBy, sortOrder] = this.selectedSort.split('-');
    this.sortBy = sortBy;
    this.sortOrder = sortOrder as 'asc' | 'desc';
    this.loadParents();
  }

  goToPage(page: any) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadParents();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadParents();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadParents();
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

  deleteParent(id: string, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will remove all parent-child relationships!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.parentService.delete(id).subscribe({
          next: () => {
            this.loadParents();
          },
          error: (error) => {
            console.error('Error deleting parent:', error);
            alert(error.error?.message || 'Failed to delete parent');
          },
        });
        Swal.fire({
          title: 'Deleted!',
          text: 'Your Parent has been deleted.',
          icon: 'success',
        });
      }
    });
  }
}
