import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
export interface LeaveRequest {
  _id: string;
  student: {
    firstName: string;
    lastName: string;
    studentId: string;
    email: string;
  };
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

export interface LeaveRequestsResponse {
  success: boolean;
  data: LeaveRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeaveRequestResponse {
  success: boolean;
  message: string;
  data: LeaveRequest;
}

export interface ApproveRejectPayload {
  status: "approved" | "rejected";
  approvedById: string;
  rejectionReason?: string;
}
@Injectable({
  providedIn: "root",
})
export class LeaveRequestApproveService {
  private apiUrl = `${environment.apiUrl}/leave-request-approves`;

  constructor(private http: HttpClient) {}

  /**
   * Get all leave requests with filtering and pagination
   */
  getLeaveRequests(
    status?: string,
    studentId?: string,
    dateFrom?: string,
    dateTo?: string,
    page: number = 1,
    limit: number = 20,
  ): Observable<LeaveRequestsResponse> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", limit.toString());

    if (status) {
      params = params.set("status", status);
    }
    if (studentId) {
      params = params.set("studentId", studentId);
    }
    if (dateFrom) {
      params = params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params = params.set("dateTo", dateTo);
    }

    return this.http.get<LeaveRequestsResponse>(this.apiUrl, { params });
  }

  /**
   * Get a single leave request by ID
   */
  getLeaveRequest(id: string): Observable<LeaveRequestResponse> {
    return this.http.get<LeaveRequestResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new leave request
   */
  createLeaveRequest(data: {
    studentId: string;
    fromDate: string;
    toDate: string;
    reason: string;
    leaveType: string;
  }): Observable<LeaveRequestResponse> {
    return this.http.post<LeaveRequestResponse>(this.apiUrl, data);
  }

  /**
   * Approve a leave request
   */
  approveLeaveRequest(
    id: string,
    approvedById: string,
  ): Observable<LeaveRequestResponse> {
    const payload: ApproveRejectPayload = {
      status: "approved",
      approvedById,
    };
    return this.http.patch<LeaveRequestResponse>(
      `${this.apiUrl}/${id}/status`,
      payload,
    );
  }

  /**
   * Reject a leave request
   */
  rejectLeaveRequest(
    id: string,
    approvedById: string,
    rejectionReason: string,
  ): Observable<LeaveRequestResponse> {
    const payload: ApproveRejectPayload = {
      status: "rejected",
      approvedById,
      rejectionReason,
    };
    return this.http.patch<LeaveRequestResponse>(
      `${this.apiUrl}/${id}/status`,
      payload,
    );
  }

  /**
   * Delete/cancel a leave request
   */
  deleteLeaveRequest(
    id: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`,
    );
  }

  /**
   * Get leave statistics for a student
   */
  getLeaveStatistics(studentId: string, year?: number): Observable<any> {
    let params = new HttpParams().set("studentId", studentId);
    if (year) {
      params = params.set("year", year.toString());
    }
    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }
}
