export interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    tokens: string;
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      studentId?: string; // Added for student users
      teacherId?: string; // Added for teacher users
      parentId?: string; // Added for parent users
    };
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  roleId: string;
}

// ===================================
// src/app/core/models/role.model.ts
// ===================================
export interface Role {
  _id: string;
  roleName: string;
  roleDescription?: string;
  createdAt?: Date;
}

// ===================================
// src/app/core/models/student.model.ts
// ===================================
export interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  dob?: Date;
  gender?: "male" | "female" | "other";
  phone?: string;
  photo?: string;
  isBlacklisted: boolean;
  selected?: boolean;
}

// ===================================
// src/app/core/models/teacher.model.ts
// ===================================
export interface Teacher {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    isActive?: boolean;
  };
  name: string;
  phone?: string;
  subject: {
    subjectName: string;
    teachTime: Date | string;
    endTime: Date | string;
  };
}

// ===================================
// src/app/core/models/attendance.model.ts
// ===================================
export interface LeaveRequest {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: {
    _id: string;
    username: string;
  };
  reviewedAt?: string;
  requestedAt: string;
  onLeave?: boolean;
}
export interface MarkAttendanceRequest {
  studentId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  markedByTeacherId: string;
  note?: string;
  subjectId?: string;
  status?: "present" | "absent" | "late" | "half-day" | "on-leave" | "excused";
}
export interface LeaveStatusResponse {
  success: boolean;
  onLeave: boolean;
  leaveDetails: LeaveRequest | null;
}
export interface Attendance {
  _id: string;
  student: any | Student;
  subject?: any | Subject; // Added subject
  date: Date | string;
  checkInTime: Date | string | null;
  checkOutTime: Date | string | null;
  status: "present" | "absent" | "late" | "half-day" | "on-leave" | "excused";
  isLate: boolean;
  lateBy: number; // Minutes
  workHours: number;
  markedByTeacher: string | Teacher;
  note?: string;
  leaveReference?: string | LeaveRequest;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  halfDays: number;
  onLeaveDays: number;
  totalLateMinutes: number;
  avgLateMinutes: number;
  totalWorkHours: number;
  avgWorkHours: number;
  attendanceRate: number;
  punctualityRate: number;
}

export interface LateReportItem {
  studentId: string;
  student: Student;
  lateCount: number;
  totalLateMinutes: number;
  avgLateMinutes: number;
  latestLateDate: Date | string;
}

export interface AbsentReportItem {
  studentId: string;
  student: Student;
  absentCount: number;
  lastAbsentDate: Date | string;
  absentDates: (Date | string)[];
}

export interface TodayAttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
}

export interface TodayAttendanceResponse {
  success: boolean;
  date: string;
  summary: TodayAttendanceSummary;
  data: Attendance[];
}

export interface AttendanceFilters {
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "present" | "absent" | "late" | "half-day" | "on-leave";
  isLate?: boolean;
  page?: number;
  limit?: number;
  subjectId?: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  count?: number;
  total?: number;
}

export interface MarkAbsentRequest {
  studentIds: string[];
  date: string;
  markedByTeacherId: string;
  note?: string;
}

export interface MarkAbsentResult {
  studentId: string;
  success: boolean;
  message: string;
  attendanceId?: string;
}

export interface MarkAbsentResponse {
  success: boolean;
  message: string;
  results: MarkAbsentResult[];
}

export interface Parent {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    isActive: boolean;
  };
  name: string;
  phone?: string;
  student?: {
    _id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    dob: Date;
    gender?: string;
    phone?: string;
    isBlacklisted?: boolean;
  };
}
export interface CreateSubjectDto {
  subjectName: string;
  teachTime: Date | string;
  endTime: Date | string;
}
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
export interface UpdateSubjectDto {
  teacherId?: string;
  subjectName?: string;
  teachTime?: Date | string;
  endTime?: Date | string;
}
export enum DayOfWeek {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday",
}

export interface Subject {
  _id: string;
  subjectName: string;
  teachTime: Date | string;
  endTime: Date | string;
  teacher?: Teacher;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  teacherId?: string;
  credit?: number;
  dayOfWeek: number;
  subjectCode?: string;
}
