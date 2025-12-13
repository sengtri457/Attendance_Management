import { Component, inject, OnInit } from "@angular/core";
import { AuthService } from "../../services/authservice/auth.service";
import { BlacklistService } from "../../services/blacklistservice/blacklist.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-black-list.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./black-list.component.html",
  styleUrl: "./black-list.component.css",
})
export class BlackListComponent implements OnInit {
  private blacklistService = inject(BlacklistService);
  private authService = inject(AuthService);

  blacklistedStudents: any[] = [];
  blacklistHistory: any[] = [];
  selectedStudent: any = null;
  loading = true;
  loadingHistory = false;
  canRestore = false;

  ngOnInit(): void {
    this.checkPermissions();
    this.loadBlacklistedStudents();
  }

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    this.canRestore = user?.role === "Admin";
  }

  loadBlacklistedStudents(): void {
    this.loading = true;
    this.blacklistService.getBlacklistedStudents().subscribe({
      next: (response) => {
        this.blacklistedStudents = response.data;
        console.dir(this.blacklistHistory);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading blacklisted students:", error);
        this.loading = false;
      },
    });
  }

  // viewHistory(student: any): void {
  //   this.selectedStudent = student;
  //   this.loadingHistory = true;
  //   this.blacklistHistory = [];

  //   this.blacklistService.getStudentBlacklistHistory(student._id).subscribe({
  //     next: (response) => {
  //       this.blacklistHistory = response.data;
  //       this.loadingHistory = false;
  //     },
  //     error: (error) => {
  //       console.error('Error loading history:', error);
  //       this.loadingHistory = false;
  //     }
  //   });
  // }

  restoreStudent(studentId: string): void {
    if (confirm("Are you sure you want to restore this student?")) {
      this.blacklistService.restoreStudent(studentId).subscribe({
        next: () => {
          this.loadBlacklistedStudents();
        },
        error: (error) => {
          console.error("Error restoring student:", error);
          alert("Failed to restore student");
        },
      });
    }
  }

  getThisMonthCount(): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return this.blacklistedStudents.filter((s) => {
      if (!s.createdAt) return false;
      const date = new Date(s.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;
  }

  getWithReasonCount(): number {
    return this.blacklistedStudents.filter((s) => s.blacklistReason).length;
  }
}
