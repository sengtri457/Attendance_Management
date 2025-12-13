import { Component, inject, OnInit } from "@angular/core";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { AbsentReportItem } from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-absent-report.component",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./absent-report.component.html",
  styleUrl: "./absent-report.component.css",
})
export class AbsentReportComponent implements OnInit {
  attendanceService = inject(AttendanceService);

  // Data
  absentReport: any[] = [];
  filteredReport: any[] = [];
  selectedStudent: any | null = null;

  // Filters
  dateFrom: string = "";
  dateTo: string = "";
  minAbsentDays: number | undefined;
  searchQuery: string = "";

  // UI State
  loading = false;
  errorMessage = "";
  viewMode: "summary" | "detailed" = "summary";
  totalCount = 0;

  // Sorting
  sortColumn: string = "absentCount";
  sortDirection: "asc" | "desc" = "desc";

  ngOnInit() {
    this.setDefaultDates();
    this.loadAbsentReport();
  }

  /**
   * Set default date range (last 30 days)
   */
  setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateFrom = thirtyDaysAgo.toISOString().split("T")[0];
    this.dateTo = today.toISOString().split("T")[0];
  }

  /**
   * Load absent report from API
   */
  loadAbsentReport() {
    this.loading = true;
    this.errorMessage = "";

    this.attendanceService
      .getAbsentReport(this.dateFrom, this.dateTo)
      .subscribe({
        next: (response) => {
          this.absentReport = response.data;
          console.log(this.absentReport);
          this.totalCount = response.count;
          this.filteredReport = [...this.absentReport];
          this.applyFilters();
          this.sortData();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || "Failed to load absentee report";
          this.loading = false;
          this.absentReport = [];
          this.filteredReport = [];
        },
      });
  }

  /**
   * Apply all filters
   */
  applyFilters() {
    this.filteredReport = this.absentReport.filter((item) => {
      // Filter by minimum absent days
      if (this.minAbsentDays && item.absentCount < this.minAbsentDays) {
        return false;
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const fullName = `${item?.firstName} ${item.lastName}`.toLowerCase();
        const studentId = item.studentId.toLowerCase();

        if (!fullName.includes(query) && !studentId.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filter by absent days
   */
  filterByAbsentDays() {
    this.applyFilters();
  }

  /**
   * Filter by search query
   */
  filterBySearch() {
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.setDefaultDates();
    this.minAbsentDays = undefined;
    this.searchQuery = "";
    this.loadAbsentReport();
  }

  /**
   * Sort data by column
   */
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "desc";
    }
    this.sortData();
  }

  /**
   * Sort the filtered report
   */
  sortData() {
    this.filteredReport.sort((a, b) => {
      let aVal: any = a[this.sortColumn as keyof AbsentReportItem];
      let bVal: any = b[this.sortColumn as keyof AbsentReportItem];

      if (this.sortColumn === "name") {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return "↕";
    return this.sortDirection === "asc" ? "↑" : "↓";
  }

  /**
   * Get badge class based on absent count
   */
  getAbsenceBadgeClass(count: number): string {
    if (count >= 5) return "critical";
    if (count >= 3) return "warning";
    return "info";
  }

  /**
   * Get status class
   */
  getStatusClass(count: number): string {
    if (count >= 5) return "critical";
    if (count >= 3) return "warning";
    return "normal";
  }

  /**
   * Get status text
   */
  getStatusText(count: number): string {
    if (count >= 5) return "Critical";
    if (count >= 3) return "At Risk";
    return "Monitor";
  }

  /**
   * Get progress bar class
   */
  getProgressClass(rate: number): string {
    if (rate >= 85) return "high";
    if (rate >= 70) return "medium";
    return "low";
  }

  /**
   * Calculate attendance rate for a student
   */
  calculateAttendanceRate(item: AbsentReportItem): number {
    const daysBetween = this.getDaysBetweenDates();
    if (daysBetween === 0) return 100;

    const presentDays = daysBetween - item.absentCount;
    const rate = (presentDays / daysBetween) * 100;
    return Math.max(0, Math.min(100, Math.round(rate)));
  }

  /**
   * Get days between date range
   */
  getDaysBetweenDates(): number {
    const start = new Date(this.dateFrom);
    const end = new Date(this.dateTo);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  /**
   * Check if date is recent (within last 7 days)
   */
  isRecentDate(date: string | Date): boolean {
    const dateObj = new Date(date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return dateObj >= sevenDaysAgo;
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    return this.attendanceService.formatDate(date);
  }

  /**
   * Get day of week
   */
  getDayOfWeek(date: string | Date): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dateObj = new Date(date);
    return days[dateObj.getDay()];
  }

  /**
   * View student details in modal
   */
  viewDetails(student: AbsentReportItem) {
    this.selectedStudent = student;
  }

  /**
   * Close detail modal
   */
  closeModal() {
    this.selectedStudent = null;
  }

  /**
   * Contact student (send email)
   */
  contactStudent(student: any) {
    const subject = encodeURIComponent(
      `Attendance Concern - ${student.firstName} ${student.lastName}`,
    );
    const body = encodeURIComponent(
      `Dear ${student.firstName},\n\n` +
        `We have noticed that you have been absent for ${student.absentCount} days.\n\n` +
        `Please contact us to discuss your attendance.\n\n` +
        `Best regards,\n` +
        `School Administration`,
    );

    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
  }

  /**
   * Export to CSV
   */
  exportToCSV() {
    const headers = [
      "Student ID",
      "First Name",
      "Last Name",
      "Absent Days",
      "Last Absent Date",
      "Status",
    ];

    const rows = this.filteredReport.map((item) => [
      item.studentId,
      item.student.firstName,
      item.student.lastName,
      item.absentCount.toString(),
      this.formatDate(item.lastAbsentDate),
      this.getStatusText(item.absentCount),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    this.downloadCSV(
      csvContent,
      `absentee-report-${this.dateFrom}-to-${this.dateTo}.csv`,
    );
  }

  /**
   * Export detailed report with absence dates
   */
  exportDetailedReport() {
    const headers = [
      "Student ID",
      "First Name",
      "Last Name",
      "Total Absent Days",
      "Attendance Rate %",
      "Status",
      "Absence Dates",
    ];

    const rows = this.filteredReport.map((item) => [
      item.studentId,
      item.student.firstName,
      item.student.lastName,
      item.absentCount.toString(),
      this.calculateAttendanceRate(item).toString(),
      this.getStatusText(item.absentCount),
      item.absentDates.map((date: Date) => this.formatDate(date)).join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    this.downloadCSV(
      csvContent,
      `absentee-detailed-report-${this.dateFrom}-to-${this.dateTo}.csv`,
    );
  }

  /**
   * Download CSV file
   */
  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Computed Statistics
  get criticalAbsences(): number {
    return this.filteredReport.filter((item) => item.absentCount >= 5).length;
  }

  get moderateAbsences(): number {
    return this.filteredReport.filter(
      (item) => item.absentCount >= 3 && item.absentCount < 5,
    ).length;
  }

  get minorAbsences(): number {
    return this.filteredReport.filter((item) => item.absentCount < 3).length;
  }

  get totalAbsenceDays(): number {
    return this.filteredReport.reduce((sum, item) => sum + item.absentCount, 0);
  }

  get averageAbsences(): string {
    if (this.filteredReport.length === 0) return "0";
    return (this.totalAbsenceDays / this.filteredReport.length).toFixed(1);
  }
}
