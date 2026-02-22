import { Component } from '@angular/core';
import { LeaveRequest } from '../../../models/user.model';
import { LeaveRequestService } from '../../../services/leaveRequestservice/leave-request.service';
import { AuthService } from '../../../services/authservice/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CountService } from '../../../service/count.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-leave-review.component',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './leave-review.component.html',
  styleUrl: './leave-review.component.css',
})
export class LeaveReviewComponent {
  leaveRequests: LeaveRequest[] = [];
  filteredRequests: LeaveRequest[] = [];
  loading = false;
  selectedStatus = 'all';
  reviewerId = '';

  selectedRequest: LeaveRequest | null = null;
  showReviewModal = false;
  reviewAction: 'approved' | 'rejected' = 'approved';
  processing = false;

  constructor(
    private leaveRequestService: LeaveRequestService,
    private authService: AuthService,
    private count: CountService
  ) {}

  ngOnInit(): void {
    this.reviewerId = this.authService.getCurrentUser().id;
    this.loadLeaveRequests();
    console.log(this.pendingCount);
  }

  loadLeaveRequests(): void {
    this.loading = true;
    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
        this.count.getCount(
          this.leaveRequests.filter((f) => {
            return f.status === 'pending';
          }).length
        );
        console.log(this.count.count);
        console.log(this.leaveRequests);
        this.filterRequests();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
        this.loading = false;
      },
    });
  }

  filterRequests(): void {
    if (this.selectedStatus === 'all') {
      this.filteredRequests = this.leaveRequests;
    } else {
      this.filteredRequests = this.leaveRequests.filter(
        (req) => req.status === this.selectedStatus
      );
    }
  }

  onStatusFilterChange(): void {
    this.filterRequests();
  }

  openReviewModal(
    request: LeaveRequest,
    action: 'approved' | 'rejected'
  ): void {
    this.selectedRequest = request;
    this.reviewAction = action;
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedRequest = null;
  }

  confirmReview(): void {
    if (!this.selectedRequest) return;

    this.processing = true;
    this.leaveRequestService
      .reviewLeaveRequest(
        this.selectedRequest._id,
        this.reviewAction,
        this.reviewerId
      )
      .subscribe({
        next: (response) => {
          this.processing = false;
          this.closeReviewModal();
          this.loadLeaveRequests();
        },
        error: (error) => {
          console.error('Error reviewing leave request:', error);
          alert('Failed to review leave request');
          this.processing = false;
        },
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'bi-check-circle-fill';
      case 'rejected':
        return 'bi-x-circle-fill';
      case 'pending':
        return 'bi-clock-fill';
      default:
        return 'bi-question-circle-fill';
    }
  }

  get pendingCount(): number {
    return this.leaveRequests.filter((r) => r.status === 'pending').length;
  }

  get approvedCount(): number {
    return this.leaveRequests.filter((r) => r.status === 'approved').length;
  }

  get rejectedCount(): number {
    return this.leaveRequests.filter((r) => r.status === 'rejected').length;
  }

  getFileUrl(path: string): string {
    if (!path) return '';
    // Assuming environment.apiUrl is like http://localhost:4000/api
    const baseUrl = environment.apiUrl.replace('/api', '');
    // Ensure path doesn't have leading slash if baseUrl has trailing, etc.
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }

  isImage(path: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  }
}
