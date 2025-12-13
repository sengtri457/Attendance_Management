import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { inject } from "@angular/core/primitives/di";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import {
  Attendance,
  AttendanceStats,
  LateReportItem,
  AbsentReportItem,
  TodayAttendanceResponse,
  AttendanceFilters,
  PaginationResponse,
  MarkAbsentRequest,
  MarkAbsentResponse,
  Student,
  LeaveRequest,
  MarkAttendanceRequest,
} from "../../models/user.model";
import { LeaveStatusCheck } from "../../models/leave.model";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  /**
   * Get all attendance records with advanced filtering
   */
  /**
   * Check if student is on leave (use leave request service method instead)
   */

  getAll(
    filters?: AttendanceFilters,
  ): Observable<PaginationResponse<Attendance>> {
    let params = new HttpParams();

    if (filters?.studentId) {
      params = params.set("studentId", filters.studentId);
    }
    if (filters?.dateFrom) {
      params = params.set("dateFrom", filters.dateFrom);
    }
    if (filters?.dateTo) {
      params = params.set("dateTo", filters.dateTo);
    }
    if (filters?.status) {
      params = params.set("status", filters.status);
    }
    if (filters?.isLate !== undefined) {
      params = params.set("isLate", filters.isLate.toString());
    }
    if (filters?.page) {
      params = params.set("page", filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set("limit", filters.limit.toString());
    }

    return this.http.get<PaginationResponse<Attendance>>(this.apiUrl, {
      params,
    });
  }

  /**
   * Mark attendance with automatic late detection
   */
  mark(attendance: {
    studentId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    markedByTeacherId: string;
    note?: string;
  }): Observable<{ success: boolean; message: string; data: Attendance }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Attendance;
    }>(this.apiUrl, attendance);
  }

  /**
   * Update existing attendance record
   */
  update(
    id: string,
    attendance: {
      checkInTime?: string;
      checkOutTime?: string;
      note?: string;
      status?: string;
    },
  ): Observable<{ success: boolean; message: string; data: Attendance }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: Attendance;
    }>(`${this.apiUrl}/${id}`, attendance);
  }

  /**
   * Delete attendance record
   */
  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`,
    );
  }

  /**
   * Get attendance statistics for a specific student
   */
  getStudentStats(
    studentId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set("dateFrom", dateFrom);
    if (dateTo) params = params.set("dateTo", dateTo);

    return this.http.get(`${this.apiUrl}/stats/${studentId}`, { params });
  }

  /**
   * Get late arrivals report
   */
  getLateReport(
    dateFrom?: string,
    dateTo?: string,
    minLateCount?: number,
  ): Observable<{ success: boolean; count: number; data: LateReportItem[] }> {
    let params = new HttpParams();
    if (dateFrom) params = params.set("dateFrom", dateFrom);
    if (dateTo) params = params.set("dateTo", dateTo);
    if (minLateCount)
      params = params.set("minLateCount", minLateCount.toString());

    return this.http.get<{
      success: boolean;
      count: number;
      data: LateReportItem[];
    }>(`${this.apiUrl}/late-report`, { params });
  }

  /**
   * Get absentee report
   */
  getAbsentReport(
    dateFrom?: string,
    dateTo?: string,
  ): Observable<{ success: boolean; count: number; data: AbsentReportItem[] }> {
    let params = new HttpParams();
    if (dateFrom) params = params.set("dateFrom", dateFrom);
    if (dateTo) params = params.set("dateTo", dateTo);

    return this.http.get<{
      success: boolean;
      count: number;
      data: AbsentReportItem[];
    }>(`${this.apiUrl}/absent-report`, { params });
  }

  /**
   * Get today's attendance overview
   */
  getTodayAttendance(): Observable<TodayAttendanceResponse> {
    return this.http.get<TodayAttendanceResponse>(`${this.apiUrl}/today`);
  }

  // mark(data: MarkAttendanceRequest): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/mark`, data);
  // }
  /**
   * Mark students as absent (bulk operation)
   */

  // attendance.service.ts
  markAbsent(
    studentIds: string[],
    date: string,
    markedByTeacherId: string,
    note?: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-absent`, {
      studentIds,
      date,
      markedByTeacherId,
      note,
    });
  }
  /**
   * Get attendance by student ID (convenience method)
   */
  getByStudent(
    studentId: string,
    dateFrom?: string,
    dateTo?: string,
    page?: number,
    limit?: number,
  ): Observable<PaginationResponse<Attendance>> {
    return this.getAll({ studentId, dateFrom, dateTo, page, limit });
  }

  /**
   * Get attendance by date range
   */
  getByDateRange(
    dateFrom: string,
    dateTo: string,
    page?: number,
    limit?: number,
  ): Observable<PaginationResponse<Attendance>> {
    return this.getAll({ dateFrom, dateTo, page, limit });
  }

  /**
   * Get late arrivals only
   */
  getLateArrivals(
    dateFrom?: string,
    dateTo?: string,
    page?: number,
    limit?: number,
  ): Observable<PaginationResponse<Attendance>> {
    return this.getAll({ isLate: true, dateFrom, dateTo, page, limit });
  }

  /**
   * Get absent students
   */
  getAbsentStudents(
    dateFrom?: string,
    dateTo?: string,
    page?: number,
    limit?: number,
  ): Observable<PaginationResponse<Attendance>> {
    return this.getAll({ status: "absent", dateFrom, dateTo, page, limit });
  }

  /**
   * Check if student is present today
   */
  isStudentPresentToday(studentId: string): Observable<boolean> {
    const today = new Date().toISOString().split("T")[0];
    return new Observable((observer) => {
      this.getAll({ studentId, dateFrom: today, dateTo: today }).subscribe({
        next: (response) => {
          const hasPresent = response.data.some(
            (att) => att.status === "present" || att.status === "late",
          );
          observer.next(hasPresent);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  /**
   * Calculate attendance percentage for a student
   */
  calculateAttendancePercentage(
    studentId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<number> {
    return new Observable((observer) => {
      this.getStudentStats(studentId, dateFrom, dateTo).subscribe({
        next: (response) => {
          observer.next(response.data.attendanceRate || 0);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  /**
   * Format time for display (HH:MM AM/PM)
   */
  formatTime(date: Date | string | null): string {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      present: "success",
      late: "warning",
      absent: "danger",
      "half-day": "info",
      "on-leave": "secondary",
    };
    return colors[status] || "secondary";
  }

  /**
   * Get status icon for UI
   */
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      present: "check-circle",
      late: "clock",
      absent: "x-circle",
      "half-day": "minus-circle",
      "on-leave": "calendar",
    };
    return icons[status] || "circle";
  }

  /**
   * Export attendance data to CSV
   */
  exportToCSV(
    data: Attendance[],
    filename: string = "attendance-report.csv",
  ): void {
    const headers = [
      "Date",
      "Student Name",
      "Student ID",
      "Check In",
      "Check Out",
      "Status",
      "Late By (min)",
      "Work Hours",
      "Note",
    ];

    const rows = data.map((att) => {
      const student = typeof att.student === "object" ? att.student : null;
      return [
        this.formatDate(att.date),
        student ? `${student.firstName} ${student.lastName}` : "N/A",
        student?.studentId || "N/A",
        this.formatTime(att.checkInTime),
        this.formatTime(att.checkOutTime),
        att.status,
        att.lateBy.toString(),
        att.workHours.toFixed(2),
        att.note || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  checkLeaveStatus(
    studentId: string,
    date: string,
  ): Observable<LeaveStatusCheck> {
    const params = new HttpParams()
      .set("studentId", studentId)
      .set("date", date);

    return this.http.get<LeaveStatusCheck>(
      `${this.apiUrl}/check-leave-status`,
      { params },
    );
  }
}
