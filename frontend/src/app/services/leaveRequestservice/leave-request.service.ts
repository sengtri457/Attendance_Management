import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  CreateLeaveRequest,
  LeaveRequestSummary,
} from "../../models/leave.model";
import { LeaveRequest } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class LeaveRequestService {
  constructor(private http: HttpClient) {}
  private apiUrl = `${environment.apiUrl}/leave-requests`;

  // Get all leave requests with optional filters
  getLeaveRequests(studentId?: string, status?: string): Observable<any> {
    let params = new HttpParams();
    if (studentId) params = params.set("studentId", studentId);
    if (status) params = params.set("status", status);

    return this.http.get(`${this.apiUrl}`, { params });
  }

  // Create leave request
  createLeaveRequest(data: {
    studentId: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  // Review leave request (approve/reject)
  reviewLeaveRequest(
    leaveId: string,
    status: "approved" | "rejected",
    reviewedById: string,
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${leaveId}/review`, {
      status,
      reviewedById,
    });
  }
  getAll(
    studentId?: string,
    status?: string,
  ): Observable<{
    success: boolean;
    data: LeaveRequest[];
  }> {
    let params = new HttpParams();

    if (studentId) {
      params = params.set("studentId", studentId);
    }
    if (status) {
      params = params.set("status", status);
    }

    return this.http.get<{
      success: boolean;
      data: LeaveRequest[];
    }>(this.apiUrl, { params });
  }

  /**
   * Get leave requests by student ID
   */
  getByStudent(
    studentId: string,
    status?: string,
  ): Observable<{
    success: boolean;
    data: LeaveRequest[];
  }> {
    return this.getAll(studentId, status);
  }

  /**
   * Get pending leave requests
   */
  getPending(): Observable<{
    success: boolean;
    data: LeaveRequest[];
  }> {
    return this.getAll(undefined, "pending");
  }

  /**
   * Get approved leave requests
   */
  getApproved(studentId?: string): Observable<{
    success: boolean;
    data: LeaveRequest[];
  }> {
    return this.getAll(studentId, "approved");
  }

  /**
   * Create a new leave request
   */
  create(request: CreateLeaveRequest): Observable<{
    success: boolean;
    message: string;
    data: { leaveId: string };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: { leaveId: string };
    }>(this.apiUrl, request);
  }

  /**
   * Review (approve/reject) a leave request
   */
  review(
    leaveId: string,
    status: "approved" | "rejected",
    reviewedById: string,
  ): Observable<{
    success: boolean;
    message: string;
    data: LeaveRequest;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: LeaveRequest;
    }>(`${this.apiUrl}/${leaveId}/review`, {
      status,
      reviewedById,
    });
  }

  /**
   * Delete a leave request
   */
  delete(leaveId: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${leaveId}`);
  }

  /**
   * Get leave request summary for a student
   */
  getSummary(
    studentId: string,
    year?: number,
  ): Observable<{
    success: boolean;
    data: LeaveRequestSummary;
  }> {
    let params = new HttpParams();

    if (year) {
      params = params.set("year", year.toString());
    }

    return this.http.get<{
      success: boolean;
      data: LeaveRequestSummary;
    }>(`${this.apiUrl}/summary/${studentId}`, { params });
  }

  /**
   * Check if student has approved leave for a specific date
   */
  checkLeaveForDate(
    studentId: string,
    date: string,
  ): Observable<{
    success: boolean;
    onLeave: boolean;
    leaveDetails: LeaveRequest | null;
  }> {
    const params = new HttpParams()
      .set("studentId", studentId)
      .set("date", date);

    return this.http.get<{
      success: boolean;
      onLeave: boolean;
      leaveDetails: LeaveRequest | null;
    }>(`${environment.apiUrl}/attendance/check-leave-status`, { params });
  }

  /**
   * Calculate total leave days for a request
   */
  calculateLeaveDays(fromDate: string | Date, toDate: string | Date): number {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both start and end date
  }

  /**
   * Format date range for display
   */
  formatDateRange(fromDate: string | Date, toDate: string | Date): string {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    if (from.toDateString() === to.toDateString()) {
      return from.toLocaleDateString("en-US", options);
    }

    return `${from.toLocaleDateString("en-US", options)} - ${to.toLocaleDateString("en-US", options)}`;
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return colors[status] || "secondary";
  }

  /**
   * Get status icon for UI
   */
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      pending: "clock",
      approved: "check-circle",
      rejected: "x-circle",
    };
    return icons[status] || "circle";
  }

  /**
   * Validate leave request dates
   */
  validateDates(
    fromDate: string | Date,
    toDate: string | Date,
  ): {
    isValid: boolean;
    error?: string;
  } {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (from < today) {
      return {
        isValid: false,
        error: "Start date cannot be in the past",
      };
    }

    if (to < from) {
      return {
        isValid: false,
        error: "End date must be after start date",
      };
    }

    return { isValid: true };
  }

  /**
   * Export leave requests to CSV
   */
  exportToCSV(
    data: LeaveRequest[],
    filename: string = "leave-requests.csv",
  ): void {
    const headers = [
      "Student Name",
      "From Date",
      "To Date",
      "Days",
      "Reason",
      "Status",
      "Requested At",
      "Reviewed By",
      "Reviewed At",
    ];

    const rows = data.map((leave) => {
      const student = typeof leave.student === "object" ? leave.student : null;
      const reviewer =
        typeof leave.reviewedBy === "object" ? leave.reviewedBy : null;
      const days = this.calculateLeaveDays(leave.fromDate, leave.toDate);

      return [
        student ? `${student.firstName} ${student.lastName}` : "N/A",
        new Date(leave.fromDate).toLocaleDateString(),
        new Date(leave.toDate).toLocaleDateString(),
        days.toString(),
        leave.reason,
        leave.status,
        new Date(leave.requestedAt).toLocaleString(),
        reviewer?.username || "N/A",
        leave.reviewedAt ? new Date(leave.reviewedAt).toLocaleString() : "N/A",
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
}
