import { Component, inject } from '@angular/core';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { LateReportItem } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-late-report.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './late-report.component.html',
  styleUrl: './late-report.component.css',
})
export class LateReportComponent {
  attendanceService = inject(AttendanceService);
  router = inject(Router);
  lateReport: any[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  minLateCount: number | undefined;

  loading = false;
  errorMessage = '';
  totalCount = 0;

  sortColumn: string = 'lateCount';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit() {
    this.setDefaultDates();
    this.loadLateReport();
  }

  setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];
  }

  loadLateReport() {
    this.loading = true;
    this.errorMessage = '';

    this.attendanceService
      .getLateReport(this.dateFrom, this.dateTo, this.minLateCount)
      .subscribe({
        next: (response) => {
          this.lateReport = response.data;
          this.totalCount = response.count;
          console.log(this.lateReport);
          this.sortData();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Failed to load late report';
          this.loading = false;
        },
      });
  }

  clearFilters() {
    this.setDefaultDates();
    this.minLateCount = undefined;
    this.loadLateReport();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.sortData();
  }

  sortData() {
    this.lateReport.sort((a, b) => {
      let aVal: any = a[this.sortColumn as keyof LateReportItem];
      let bVal: any = b[this.sortColumn as keyof LateReportItem];

      if (this.sortColumn === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  get totalLateInstances(): number {
    return this.lateReport.reduce((sum, item) => sum + item.lateCount, 0);
  }

  get averageLateCount(): string {
    if (this.lateReport.length === 0) return '0';
    return (this.totalLateInstances / this.lateReport.length).toFixed(1);
  }

  get averageLateMinutes(): string {
    if (this.lateReport.length === 0) return '0';
    const totalMinutes = this.lateReport.reduce(
      (sum, item) => sum + item.totalLateMinutes,
      0
    );
    return (totalMinutes / this.totalLateInstances).toFixed(1);
  }

  formatDate(date: string | Date): string {
    return this.attendanceService.formatDate(date);
  }
  backToDashboard() {
    this.router.navigateByUrl('/attendance');
  }
  exportToCSV() {
    const headers = [
      'Student ID',
      'First Name',
      'Last Name',
      'Late Count',
      'Average Late By (min)',
      'Total Late Minutes',
      'Last Late Date',
    ];

    const rows = this.lateReport.map((item) => [
      item.studentId,
      item?.student.firstName,
      item?.student.lastName,
      item.lateCount.toString(),
      item.avgLateMinutes.toString(),
      item.totalLateMinutes.toString(),
      this.formatDate(item.latestLateDate),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `late-report-${this.dateFrom}-to-${this.dateTo}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
