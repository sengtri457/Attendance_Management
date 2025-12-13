import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LeaveRequestApproveService } from "../../../services/leaveApprove/leave-request-approve.service";
import { AuthService } from "../../../services/authservice/auth.service";

interface Student {
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
}

interface LeaveRequest {
  _id: string;
  student: Student;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: any;
  approvedAt?: string;
  rejectionReason?: string;
}

@Component({
  selector: "app-leave-approve.component",
  imports: [CommonModule, FormsModule],
  templateUrl: "./leave-approve.component.html",
  styleUrl: "./leave-approve.component.css",
})
export class LeaveApproveComponent {
  leaveRequests: LeaveRequest[] = [];
  filteredRequests: LeaveRequest[] = [];
  selectedLeave: LeaveRequest | null = null;

  // Filter options
  statusFilter: string = "pending";
  searchTerm: string = "";

  // Modal state
  showRejectModal: boolean = false;
  rejectionReason: string = "";

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Loading state
  isLoading: boolean = false;

  constructor(
    private leaveService: LeaveRequestApproveService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  loadLeaveRequests(): void {
    this.isLoading = true;

    this.leaveService
      .getLeaveRequests(
        this.statusFilter || undefined,
        undefined, // studentId
        undefined, // dateFrom
        undefined, // dateTo
        this.currentPage,
        this.itemsPerPage,
      )
      .subscribe({
        next: (response) => {
          this.leaveRequests = response.data;
          this.filteredRequests = response.data;
          this.totalPages = response.pagination.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error("Error loading leave requests:", error);
          this.isLoading = false;
          alert("Failed to load leave requests");
        },
      });
  }

  approveLeave(leave: LeaveRequest): void {
    if (
      !confirm(
        `Approve leave request for ${leave.student.firstName} ${leave.student.lastName}?`,
      )
    ) {
      return;
    }

    const teacherId = this.getCurrentTeacherId();

    this.leaveService.approveLeaveRequest(leave._id, teacherId).subscribe({
      next: (response) => {
        alert("Leave request approved successfully!");
        leave.status = "approved";
        this.loadLeaveRequests(); // Reload to update list
      },
      error: (error) => {
        console.error("Error approving leave:", error);
        alert("Failed to approve leave request");
      },
    });
  }

  openRejectModal(leave: LeaveRequest): void {
    this.selectedLeave = leave;
    this.showRejectModal = true;
    this.rejectionReason = "";
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedLeave = null;
    this.rejectionReason = "";
  }

  rejectLeave(): void {
    if (!this.rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!this.selectedLeave) return;

    const teacherId = this.getCurrentTeacherId();

    this.leaveService
      .rejectLeaveRequest(
        this.selectedLeave._id,
        teacherId,
        this.rejectionReason,
      )
      .subscribe({
        next: (response) => {
          alert("Leave request rejected");
          this.closeRejectModal();
          this.loadLeaveRequests();
        },
        error: (error) => {
          console.error("Error rejecting leave:", error);
          alert("Failed to reject leave request");
        },
      });
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveRequests();
  }

  onSearchChange(): void {
    if (this.searchTerm.trim() === "") {
      this.filteredRequests = this.leaveRequests;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredRequests = this.leaveRequests.filter(
        (leave) =>
          leave.student.firstName.toLowerCase().includes(term) ||
          leave.student.lastName.toLowerCase().includes(term) ||
          leave.student.studentId.toLowerCase().includes(term),
      );
    }
  }

  getDaysDifference(from: string, to: string): number {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getLeaveTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      sick: "badge-sick",
      casual: "badge-casual",
      emergency: "badge-emergency",
      personal: "badge-personal",
      other: "badge-other",
    };
    return classes[type] || "badge-other";
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: "badge-pending",
      approved: "badge-approved",
      rejected: "badge-rejected",
    };
    return classes[status] || "badge-pending";
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLeaveRequests();
    }
  }

  getCurrentTeacherId(): string {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error("No authenticated user found");
      return "";
    }

    return currentUser._id;
  }
}
