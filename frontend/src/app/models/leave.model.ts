import { Student } from "./user.model";

// Leave Request Models
export interface LeaveRequest {
  _id: string;
  student: string;
  fromDate: Date | string;
  toDate: Date | string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | { username: string; _id: string };
  reviewedAt?: Date | string;
  requestedAt: Date | string;
}

export interface CreateLeaveRequest {
  studentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface ReviewLeaveRequest {
  status: "approved" | "rejected";
  reviewedById: string;
}

export interface LeaveRequestSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalDaysApproved: number;
}

export interface LeaveStatusCheck {
  success: boolean;
  onLeave: boolean;
  leaveDetails: LeaveRequest | null;
}
