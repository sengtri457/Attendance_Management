import { Component, inject, OnInit } from "@angular/core";
import { ParentService } from "../../../services/parentservice/parent.service";
import { AuthService } from "../../../services/authservice/auth.service";
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-parent-list.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./parent-list.component.html",
  styleUrl: "./parent-list.component.css",
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

  ngOnInit(): void {
    // If parent user, redirect to their profile
    if (this.authService.isParent()) {
      const parentId = this.authService.getParentId();
      if (parentId) {
        this.router.navigate(["/parents", parentId]);
        return;
      }
    }

    this.checkPermissions();
    this.loadParents();
  }

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.canCreate = user.role === "Admin";
      this.canEdit = ["Admin", "Teacher"].includes(user.role);
      this.canDelete = user.role === "Admin";
    }
  }

  loadParents(): void {
    this.parentService.getAll().subscribe({
      next: (response) => {
        this.parents = response.data;
        console.log(this.parents);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading parents:", error);
        this.loading = false;
      },
    });
  }

  deleteParent(id: string, event: Event): void {
    event.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this parent? This will remove all parent-child relationships.",
      )
    ) {
      this.parentService.delete(id).subscribe({
        next: () => {
          this.loadParents();
        },
        error: (error) => {
          console.error("Error deleting parent:", error);
          alert(error.error?.message || "Failed to delete parent");
        },
      });
    }
  }
}
