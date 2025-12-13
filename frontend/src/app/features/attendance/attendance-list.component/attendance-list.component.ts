import { Component, OnInit, Pipe } from '@angular/core';
import {
  Attendance,
  AttendanceFilters,
  PaginationResponse,
} from '../../../models/user.model';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-attendance-list.component',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css',
})
export class AttendanceListComponent implements OnInit {
  attendanceRecords: Attendance[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  public Math = Math;
  filters: AttendanceFilters = {
    page: 1,
    limit: 20,
  };

  constructor(public attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.loading = true;
    this.attendanceService.getAll(this.filters).subscribe({
      next: (response) => {
        this.attendanceRecords = response.data;
        console.log(this.attendanceRecords);
        this.currentPage = response.pagination?.page || 1;
        this.totalPages = response.pagination?.totalPages || 1;
        this.totalRecords = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadAttendance();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadAttendance();
  }

  exportData(): void {
    this.attendanceService.exportToCSV(
      this.attendanceRecords,
      'attendance-records.csv'
    );
  }

  clearFilters(): void {
    this.filters = { page: 1, limit: 20 };
    this.loadAttendance();
  }
}
