import { Component, OnInit, inject } from "@angular/core";
import {
  StudentQueryParams,
  StudentService,
} from "../../../services/studentservices/student.service";
import { QRCodeComponent } from 'angularx-qrcode';
import { Student } from "../../../models/user.model";
import { ClassGroupService } from "../../../services/class-groupservice/class-group.service";
import { ClassGroup } from "../../../models/class-group.model";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/authservice/auth.service";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { FormsModule } from "@angular/forms";
import Swal from "sweetalert2";

@Component({
  selector: "app-student-list.component",
  imports: [CommonModule, RouterModule, FormsModule, QRCodeComponent],
  templateUrl: "./student-list.component.html",
  styleUrl: "./student-list.component.css",
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);
  private classGroupService = inject(ClassGroupService);
  private authService = inject(AuthService);
  private router = inject(Router);
  students: Student[] = [];
  classGroups: ClassGroup[] = [];
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

  // Filter
  selectedClassGroup = "";
  selectedStudentIdForQR: string | null = null;

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



    this.loadClassGroups();
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
        classGroupId: this.selectedClassGroup,
      })
      .subscribe({
        next: (response) => {
          this.students = response.data;
          console.log(this.students);
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



  loadClassGroups() {
    this.classGroupService.getAllClassGroups().subscribe({
      next: (res) => {
        this.classGroups = res.data;
      },
      error: (err) => console.error("Error loading class groups", err),
    });
  }

  onClassGroupChange() {
    this.currentPage = 1;
    this.loadStudents();
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

  showQR(studentId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedStudentIdForQR = studentId;
  }

  closeQR(): void {
    this.selectedStudentIdForQR = null;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      Swal.fire({
        title: "Importing...",
        text: "Please wait while we process the file",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.studentService.importStudents(file).subscribe({
        next: (res) => {
          let errorHtml = "";
          if (res.results.errors && res.results.errors.length > 0) {
            errorHtml =
              '<div class="text-start mt-3" style="max-height: 200px; overflow-y: auto;"><h5>Errors:</h5><ul class="list-group">';
            res.results.errors.forEach((err: any) => {
              const identifier =
                err.row.email || err.row.username || "Unknown Row";
              errorHtml += `<li class="list-group-item list-group-item-danger small">
                 <strong>${identifier}:</strong> ${err.error}
               </li>`;
            });
            errorHtml += "</ul></div>";
          }

          Swal.fire({
            icon: res.results.failed > 0 ? "warning" : "success",
            title: "Import Completed",
            html: `
              <div class="mb-3">
                <p>Total: <strong>${res.results.total}</strong></p>
                <p class="text-success">Success: <strong>${res.results.success}</strong></p>
                <p class="text-danger">Failed: <strong>${res.results.failed}</strong></p>
              </div>
              ${errorHtml}
            `,
            width: res.results.failed > 0 ? "600px" : "32em",
          });
          this.loadStudents();
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Import Failed",
            text: err.error?.message || "Something went wrong",
          });
        },
      });
    }
  }
}
