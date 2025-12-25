import { Component } from '@angular/core';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Attendance } from '../../../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form-attendance.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './form-attendance.component.html',
  styleUrl: './form-attendance.component.css',
})
export class FormAttendanceComponent {
  attendance: any;
  attendanceId: string = '';

  // Form fields
  checkInTime: string = '';
  checkOutTime: string = '';
  note: string = '';
  status: string = '';

  // UI state
  loading: boolean = false;
  saving: boolean = false;
  deleting: boolean = false;
  error: string = '';
  success: string = '';
  showDeleteConfirm: boolean = false;

  statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' },
    { value: 'half-day', label: 'Half Day' },
  ];

  constructor(
    private attendanceService: AttendanceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.attendanceId = this.route.snapshot.params['id'];
    if (this.attendanceId) {
      this.loadAttendance();
    }
  }

  /**
   * Load attendance record by ID
   */
  loadAttendance(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getByStudent(this.attendanceId).subscribe({
      next: (response: any) => {
        this.attendance = response.data;
        console.log(this.attendance);
        this.populateForm();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load attendance record';
        this.loading = false;
        console.error('Error loading attendance:', err);
      },
    });
  }

  /**
   * Populate form with existing data
   */
  populateForm(): void {
    if (this.attendance) {
      this.checkInTime = this.formatTimeForInput(this.attendance.checkInTime);
      this.checkOutTime = this.formatTimeForInput(this.attendance.checkOutTime);
      this.note = this.attendance.note || '';
      this.status = this.attendance.status;
    }
  }

  /**
   * Format ISO date string to datetime-local input format
   */
  formatTimeForInput(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Update attendance record
   */
  updateAttendance(): void {
    this.saving = true;
    this.error = '';
    this.success = '';

    const updateData: any = {};

    // Only include fields that have been modified
    if (
      this.checkInTime &&
      this.checkInTime !==
        this.formatTimeForInput(this.attendance?.checkInTime || null)
    ) {
      updateData.checkInTime = new Date(this.checkInTime).toISOString();
    }

    if (
      this.checkOutTime &&
      this.checkOutTime !==
        this.formatTimeForInput(this.attendance?.checkOutTime || null)
    ) {
      updateData.checkOutTime = new Date(this.checkOutTime).toISOString();
    }

    if (this.note !== (this.attendance?.note || '')) {
      updateData.note = this.note;
    }

    if (this.status && this.status !== this.attendance?.status) {
      updateData.status = this.status;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      this.error = 'No changes detected';
      this.saving = false;
      return;
    }

    this.attendanceService.update(this.attendanceId, updateData).subscribe({
      next: (response) => {
        this.success = response.message || 'Attendance updated successfully';
        this.attendance = response.data;
        this.populateForm();
        this.saving = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update attendance';
        this.saving = false;
        console.error('Error updating attendance:', err);
      },
    });
  }

  /**
   * Show delete confirmation dialog
   */
  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  /**
   * Delete attendance record
   */
  deleteAttendance(): void {
    this.deleting = true;
    this.error = '';
    this.showDeleteConfirm = false;

    this.attendanceService.delete(this.attendanceId).subscribe({
      next: (response) => {
        // Navigate back to attendance list or dashboard
        this.router.navigate(['/attendance']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete attendance';
        this.deleting = false;
        console.error('Error deleting attendance:', err);
      },
    });
  }

  /**
   * Reset form to original values
   */
  resetForm(): void {
    this.populateForm();
    this.error = '';
    this.success = '';
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['/attendance']);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      present: 'status-present',
      absent: 'status-absent',
      late: 'status-late',
      excused: 'status-excused',
      'half-day': 'status-half-day',
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Format work hours for display
   */
  formatWorkHours(hours: number): string {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  /**
   * Format late by minutes
   */
  formatLateBy(minutes: number): string {
    if (!minutes || minutes <= 0) return 'On time';
    if (minutes < 60) return `${minutes} min late`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m late`;
  }
}
