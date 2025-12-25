import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { Attendance, TodayAttendanceSummary } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/authservice/auth.service';
import { LeaveRequestService } from '../../../services/leaveRequestservice/leave-request.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-attendance-dashboard.component',
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.css',
})
export class AttendanceDashboardComponent implements OnInit {
  // Edit modal state
  showEditModal = false;
  editingAttendance: Attendance | null = null;

  // Edit state (inline editing)
  editingId: string | null = null;
  editForm = {
    checkInTime: '',
    checkOutTime: '',
    note: '',
  };

  // Delete confirmation
  showDeleteModal = false;
  deletingAttendance: Attendance | null = null;
  summary: TodayAttendanceSummary = {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
  };
  todayAttendance: any[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  currentDate = new Date();
  countLeave: any[] = [];
  constructor(
    public attendanceService: AttendanceService,
    public auth: AuthService,
    private router: Router,
    private leaveService: LeaveRequestService
  ) {}

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadCountLeave();
  }
  leaveRequest() {
    this.router.navigateByUrl('leave/request');
  }
  loadCountLeave() {
    this.leaveService.getAll().subscribe({
      next: (response) => {
        this.countLeave = response.data;
        console.log('Count of leave requests:', this.countLeave.length);
      },
      error: (error) => {
        console.error('Error loading count of leave requests:', error);
      },
    });
  }

  loadTodayAttendance(): void {
    this.loading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.todayAttendance = response.data;
        console.log(this.todayAttendance);
        console.log("Today's attendance:", this.todayAttendance);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading today's attendance:", error);
        this.loading = false;
      },
    });
  }

  getAttendanceRate(): number {
    if (this.summary.total === 0) return 0;
    return Math.round(
      ((this.summary.present + this.summary.onLeave) / this.summary.total) * 100
    );
  }

  getPunctualityRate(): number {
    if (this.summary.present === 0) return 0;
    return Math.round(
      ((this.summary.present - this.summary.late) / this.summary.present) * 100
    );
  }
  /**
   * Check if a row is being edited
   */
  isEditing(attendanceId: string): boolean {
    return this.editingId === attendanceId;
  }
  /**
   * Start editing a row
   */
  startEdit(attendance: Attendance): void {
    this.editingId = attendance._id;
    this.editForm = {
      checkInTime: this.formatTimeForInput(attendance.checkInTime),
      checkOutTime: this.formatTimeForInput(attendance.checkOutTime),
      note: attendance.note || '',
    };
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingId = null;
    this.editForm = {
      checkInTime: '',
      checkOutTime: '',
      note: '',
    };
  }

  /**
   * Save the edited attendance
   */
  saveEdit(attendanceId: string): void {
    const updateData: any = {
      note: this.editForm.note,
    };

    // Only include times if they've been changed
    if (this.editForm.checkInTime) {
      updateData.checkInTime = this.convertToDateTime(
        this.editForm.checkInTime
      );
    }
    if (this.editForm.checkOutTime) {
      updateData.checkOutTime = this.convertToDateTime(
        this.editForm.checkOutTime
      );
    }

    this.loading = true;

    this.attendanceService.update(attendanceId, updateData).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Attendance updated successfully',
          timer: 2000,
          showConfirmButton: false,
        });
        this.cancelEdit();
        this.loadTodayAttendance();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            err.error?.message ||
            'Failed to update attendance. Please try again.',
          confirmButtonColor: '#007bff',
        });
        console.error('Error updating attendance:', err);
        this.loading = false;
      },
    });
  }
  /**
   * Open delete confirmation modal
   */
  confirmDelete(attendance: Attendance): void {
    const student =
      typeof attendance.student === 'object' ? attendance.student : null;
    const studentName = student
      ? `${student.firstName} ${student.lastName}`
      : 'Unknown Student';

    Swal.fire({
      title: 'Confirm Delete',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 48px; color: #ffc107; margin-bottom: 16px;">⚠️</div>
          <p>Are you sure you want to delete the attendance record for:</p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0; font-weight: bold;">${studentName}</p>
            <p style="margin: 4px 0;">${this.formatDate(attendance.date)}</p>
          </div>
          <p style="color: #d32f2f; font-weight: 600; font-size: 13px;">This action cannot be undone.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteAttendance(attendance._id);
      }
    });
  }

  /**
   * Delete attendance record
   */
  deleteAttendance(attendanceId: string): void {
    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.attendanceService.delete(attendanceId).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Attendance record has been deleted',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadTodayAttendance();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            err.error?.message ||
            'Failed to delete attendance. Please try again.',
          confirmButtonColor: '#007bff',
        });
        console.error('Error deleting attendance:', err);
      },
    });
  }
  /**
   * Format time for input field (HH:mm)
   */
  formatTimeForInput(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Convert time input to full datetime string
   */
  convertToDateTime(timeString: string): string {
    if (!timeString) return '';
    const today = new Date();
    const [hours, minutes] = timeString.split(':');
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return today.toISOString();
  }

  /**
   * Get student name from attendance record
   */
  getStudentName(attendance: Attendance): string {
    const student =
      typeof attendance.student === 'object' ? attendance.student : null;
    if (!student) return 'Unknown Student';
    return `${student.firstName} ${student.lastName}`;
  }

  /**
   * Get student ID from attendance record
   */
  getStudentId(attendance: Attendance): string {
    const student =
      typeof attendance.student === 'object' ? attendance.student : null;
    return student?.studentId || 'N/A';
  }

  /**
   * Format time for display
   */
  formatTime(date: Date | string | null): string {
    return this.attendanceService.formatTime(date);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
