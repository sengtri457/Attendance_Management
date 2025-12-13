import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ParentService } from "../../../services/parentservice/parent.service";
import { StudentService } from "../../../services/studentservices/student.service";
import { AuthService } from "../../../services/authservice/auth.service";
import { Parent } from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-parent-detail.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./parent-detail.component.html",
  styleUrl: "./parent-detail.component.css",
})
export class ParentDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentService = inject(ParentService);
  private studentService = inject(StudentService);
  private authService = inject(AuthService);

  parent: Parent | null = null;
  children: any[] = [];
  availableStudents: any[] = [];
  selectedStudentId = "";
  loading = true;
  loadingChildren = true;
  addingChild = false;
  canEdit = false;
  isParentUser = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");

    if (id) {
      // Check if parent is viewing their own profile
      const currentUser = this.authService.getCurrentUser();
      const parentId = this.authService.getParentId();

      this.isParentUser = currentUser?.role === "Parent";

      if (this.isParentUser && parentId && id !== parentId) {
        this.router.navigate(["/parents", parentId]);
        return;
      }

      this.loadParent(id);
      this.loadChildren(id);
      this.loadAvailableStudents();
    }

    const user = this.authService.getCurrentUser();
    this.canEdit = user && ["Admin", "Teacher"].includes(user.role);
  }

  loadParent(id: string): void {
    this.parentService.getById(id).subscribe({
      next: (response) => {
        this.parent = response.data;
        console.log(this.parent);

        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading parent:", error);
        this.loading = false;
      },
    });
  }

  loadChildren(id: string): void {
    this.parentService.getChildren(id).subscribe({
      next: (response) => {
        this.children = response.data;
        console.log(this.children);
        this.loadingChildren = false;
      },
      error: (error) => {
        console.error("Error loading children:", error);
        this.loadingChildren = false;
      },
    });
  }

  loadAvailableStudents(): void {
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.availableStudents = response.data;
      },
      error: (error) => {
        console.error("Error loading students:", error);
      },
    });
  }

  addChild(): void {
    if (!this.selectedStudentId || !this.parent) return;

    this.addingChild = true;
    this.parentService
      .addChild(this.parent._id, this.selectedStudentId)
      .subscribe({
        next: () => {
          this.addingChild = false;
          this.selectedStudentId = "";
          this.loadChildren(this.parent!._id);

          // Close modal
          const modal = document.getElementById("addChildModal");
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
          bsModal?.hide();
        },
        error: (error) => {
          console.error("Error adding child:", error);
          alert(error.error?.message || "Failed to add child");
          this.addingChild = false;
        },
      });
  }

  removeChild(studentId: string): void {
    if (!this.parent) return;

    if (
      confirm("Are you sure you want to remove this child from this parent?")
    ) {
      this.parentService.removeChild(this.parent._id, studentId).subscribe({
        next: () => {
          this.loadChildren(this.parent!._id);
        },
        error: (error) => {
          console.error("Error removing child:", error);
          alert(error.error?.message || "Failed to remove child");
        },
      });
    }
  }

  getActiveChildren(): number {
    return this.children.filter((c) => !c.isBlacklisted).length;
  }
}
