import { Component, OnInit, inject } from "@angular/core";
import {
  StudentQueryParams,
  StudentService,
} from "../../../services/studentservices/student.service";
import { Student } from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/authservice/auth.service";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { FormsModule } from "@angular/forms";
import Swal from "sweetalert2";

@Component({
  selector: "app-student-list.component",
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./student-list.component.html",
  styleUrl: "./student-list.component.css",
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  students: Student[] = [];
  // Pagination
  currentPage = 1;
  totalPages = 0;
  totalCount = 0;
  limit = 10;
  selectedLimit = 10;

  // Search
  searchTerm = "";
  Math = Math;
  private searchSubject = new Subject<string>();

  // Sorting
  selectedSort = "createdAt-desc";
  sortBy = "createdAt";
  sortOrder: "asc" | "desc" = "desc";
  isLoading = false;
  loading = true;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  currentUser: any;
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log("Current User:", this.currentUser);
    this.checkPermissions();
    if (this.authService.isStudent()) {
      const studentId = this.authService.getStudentId();
      this.router.navigate(["/students", studentId]);
      // Redirects to their profile only!
    }
    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on search
        this.loadStudents();
      });

    this.loadStudents();
  }

  checkPermissions() {
    const currentUser = this.authService.getCurrentUser();
    console.log(currentUser);
    if (currentUser) {
      this.canCreate = currentUser.role === "Admin";
      this.canEdit = ["Admin", "Teacher"].includes(currentUser.role);
      this.canDelete = currentUser.role === "Admin";
    }
  }

  loadStudents() {
    this.loading = true;

    this.studentService
      .getAll({
        page: this.currentPage,
        limit: this.limit,
        search: this.searchTerm,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      })
      .subscribe({
        next: (response) => {
          this.students = response.data;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalCount = response.pagination.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error("Error loading students:", error);
          this.loading = false;
        },
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = "";
    this.currentPage = 1;
    this.loadStudents();
  }

  onLimitChange() {
    this.limit = this.selectedLimit;
    this.currentPage = 1;
    this.loadStudents();
  }

  onSortChange() {
    const [sortBy, sortOrder] = this.selectedSort.split("-");
    this.sortBy = sortBy;
    this.sortOrder = sortOrder as "asc" | "desc";
    this.loadStudents();
  }

  goToPage(page: any) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadStudents();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadStudents();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxPages = 5; // Show max 5 page numbers

    if (this.totalPages <= maxPages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(this.totalPages);
    }

    return pages;
  }

  deleteStudent(id: string, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: "Are you sure?",
      text: "You want to blacklist this student?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleted!",
          text: "student has been deleted.",
          icon: "success",
        });
        this.studentService.delete(id).subscribe({
          next: () => {
            this.loadStudents();
          },
          error: (error) => {
            console.error("Error deleting student:", error);
            alert("Failed to delete student");
          },
        });
      }
    });
  }
}
