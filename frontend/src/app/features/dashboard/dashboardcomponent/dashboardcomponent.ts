import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { AuthService } from "../../../services/authservice/auth.service";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { StudentService } from "../../../services/studentservices/student.service";
import {
  Attendance,
  LeaveRequest,
  Parent,
  Student,
  Teacher,
  TodayAttendanceResponse,
  TodayAttendanceSummary,
} from "../../../models/user.model";
import { TeacherService } from "../../../services/teacherservice/teacher.service";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { ParentService } from "../../../services/parentservice/parent.service";
import { LeaveRequestService } from "../../../services/leaveRequestservice/leave-request.service";
import { Chart, ChartConfiguration, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: "app-dashboardcomponent",
  standalone: true,
  imports: [FormsModule, RouterModule, RouterLink],
  templateUrl: "./dashboardcomponent.html",
  styleUrl: "./dashboardcomponent.css",
})
export class Dashboardcomponent implements OnInit, AfterViewInit {
  // Canvas references
  @ViewChild("barCanvas") barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("pieCanvas") pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("doughnutCanvas") doughnutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("lineCanvas") lineCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private barChart?: Chart;
  private pieChart?: Chart;
  private doughnutChart?: Chart;
  private lineChart?: Chart;

  // Inject services
  private authService = inject(AuthService);
  private router = inject(Router);
  private studentservice = inject(StudentService);
  private teacherService = inject(TeacherService);
  private attendanceService = inject(AttendanceService);
  private parentService = inject(ParentService);
  private leaveRequestService = inject(LeaveRequestService);

  // Week navigation
  weekOffset = 0;
  weekRangeLabel = '';
  weekSummary = { present: 0, late: 0, onLeave: 0, absent: 0 };
  leaveRequests: any[] = [];

  summary: TodayAttendanceSummary = {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
  };

  // User and role information
  currentUser: any;
  isStudent = false;
  isTeacher = false;
  isParent = false;
  isAdmin = false;

  // IDs for different roles
  studentId: string | null = null;
  teacherId: string | null = null;
  parentId: string | null = null;

  // Data arrays for admin dashboard
  students: any[] = [];
  teacher: any[] = [];
  parents: any[] = [];
  attendance: any[] = [];
  todayAttendance: any[] = [];

  // Student specific information
  studentSpecificInformation: any;

  ngOnInit(): void {
    // Get current user and role information
    this.currentUser = this.authService.getCurrentUser();
    this.isStudent = this.authService.isStudent();
    this.isTeacher = this.authService.isTeacher();
    this.isParent = this.authService.isParent();
    this.isAdmin = this.authService.isAdmin();

    // Get role-specific IDs
    this.studentId = this.authService.getStudentId();
    this.teacherId = this.authService.getTeacherId();
    this.parentId = this.authService.getParentId();

    console.log("Current User:", this.currentUser);
    console.log("Student ID:", this.studentId);
    console.log("Teacher ID:", this.teacherId);
    console.log("Parent ID:", this.parentId);
    console.log("Is Admin:", this.isAdmin);

    // Load data based on role
    if (this.isStudent && this.studentId) {
      this.loadStudentDashboard();
    } else if (this.isTeacher || this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isParent && this.parentId) {
      this.loadParentDashboard();
    }
  }
  // load LeaveRequest

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    if (this.isAdmin || this.isTeacher) {
      this.initializeCharts();
    }
  }

  // Initialize all charts
  initializeCharts(): void {
    this.createBarChart();
    this.createDoughnutChart();
    this.createLineChart();
  }

  // Create Bar Chart
  createBarChart(): void {
    if (!this.barCanvas) return;

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: ["Students", "Teachers", "Parents", "Attendance"],
        datasets: [
          {
            label: "Total Count",
            data: [0, 1, 2, 10],
            backgroundColor: [
              "rgba(79, 70, 229, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "hsla(302, 100%, 50%, 0.80)",
            ],
            borderColor: [
              "rgb(79, 70, 229)",
              "rgb(16, 185, 129)",
              "rgba(245, 158, 11, 0.8)",
              "hsla(302, 100%, 50%, 0.80)",
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 12, weight: "bold" },
              padding: 15,
            },
          },
          title: {
            display: true,
            text: "System Users Overview",
            font: { size: 16, weight: "bold" },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { font: { size: 11 } },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: "bold" } },
          },
        },
      },
    };

    this.barChart = new Chart(this.barCanvas.nativeElement, config);
  }

  // Create Doughnut Chart
  createDoughnutChart(): void {
    if (!this.doughnutCanvas) return;

    const config: ChartConfiguration = {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent", "Late", "On Leave"],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "rgba(147, 51, 234, 0.8)",
            ],
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              font: { size: 12, weight: "bold" },
              padding: 15,
            },
          },
          title: {
            display: true,
            text: "Attendance Status",
            font: { size: 16, weight: "bold" },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce(
                  (a: number, b: number) => a + (typeof b === "number" ? b : 0),
                  0,
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, config);
  }
  // Create Modern Multi-Line Chart with Present, Late, On Leave
  createLineChart(): void {
    if (!this.lineCanvas) return;

    const weekDays = this.getWeekDays();
    const labels = weekDays.map((date) => this.formatDateLabel(date));
    this.weekRangeLabel = this.getWeekRangeLabel(weekDays);

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Present",
            data: new Array(7).fill(0),
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
              gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgba(16, 185, 129, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 3,
          },
          {
            label: "Late",
            data: new Array(7).fill(0),
            borderColor: "rgba(245, 158, 11, 1)",
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(245, 158, 11, 0.2)");
              gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(245, 158, 11, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgba(245, 158, 11, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 3,
          },
          {
            label: "On Leave",
            data: new Array(7).fill(0),
            borderColor: "rgba(139, 92, 246, 1)",
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(139, 92, 246, 0.2)");
              gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(139, 92, 246, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgba(139, 92, 246, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 3,
          },
          {
            label: "Absent",
            data: new Array(7).fill(0),
            borderColor: "rgba(239, 68, 68, 1)",
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
              gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(239, 68, 68, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgba(239, 68, 68, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              font: {
                size: 13,
                weight: 600,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              color: "#374151",
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            padding: 16,
            cornerRadius: 12,
            titleColor: "#fff",
            bodyColor: "#e5e7eb",
            borderColor: "rgba(99, 102, 241, 0.3)",
            borderWidth: 1,
            displayColors: true,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                const date = new Date(weekDays[index]);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return `${dayNames[date.getDay()]}, ${this.formatDateLabel(weekDays[index])}`;
              },
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const label = context.dataset.label || '';
                return `  ${label}: ${value} students`;
              },
              afterBody: (context) => {
                const index = context[0].dataIndex;
                const presentVal = (this.lineChart?.data.datasets[0].data[index] as number) || 0;
                const lateVal = (this.lineChart?.data.datasets[1].data[index] as number) || 0;
                const leaveVal = (this.lineChart?.data.datasets[2].data[index] as number) || 0;
                const absentVal = (this.lineChart?.data.datasets[3].data[index] as number) || 0;
                const total = presentVal + lateVal + leaveVal + absentVal;
                return total > 0 ? [`\n  Total: ${total} students`] : [];
              },
            },
            titleFont: {
              size: 14,
              weight: 600,
              family: "'Inter', 'Segoe UI', sans-serif",
            },
            bodyFont: {
              size: 13,
              weight: 500,
              family: "'Inter', 'Segoe UI', sans-serif",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 10,
            ticks: {
              font: {
                size: 12,
                weight: 500,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              stepSize: 2,
              color: "#6b7280",
              padding: 10,
              precision: 0,
            },
            grid: {
              color: "rgba(229, 231, 235, 0.6)",
              lineWidth: 1,
              display: true,
            },
            border: {
              display: false,
            },
            title: {
              display: true,
              text: "Number of Students",
              font: {
                size: 13,
                weight: 600,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              color: "#374151",
              padding: { bottom: 10 },
            },
          },
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: 600,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              maxRotation: 0,
              minRotation: 0,
              color: "#6b7280",
              padding: 10,
            },
          },
        },
      },
    };

    this.lineChart = new Chart(this.lineCanvas.nativeElement, config);
  }

  // Student Dashboard - Load student specific info
  loadStudentDashboard(): void {
    if (this.studentId) {
      this.studentservice.getById(this.studentId).subscribe({
        next: (response: any) => {
          this.studentSpecificInformation = response;
          console.log("Student Info:", this.studentSpecificInformation);
        },
        error: (error) => {
          console.error("Error loading student info:", error);
        },
      });
    }
  }

  // Admin Dashboard - Load all counts
  loadAdminDashboard(): void {
    this.countStudents();
    this.countTeachers();
    this.countParents();
    this.loadTodayAttendance();
    this.countAttendance();
    this.loadLeaveRequests();
  }

  // Parent Dashboard
  loadParentDashboard(): void {
    console.log("Loading parent dashboard...");
  }

  // Count all students
  countStudents(): void {
    this.studentservice.getAll().subscribe({
      next: (response: any) => {
        this.students = response.data;
        console.log("Total Students:", this.students.length);
        this.updateCharts();
      },
      error: (error) => {
        console.error("Error loading students:", error);
      },
    });
  }

  // Count all teachers
  countTeachers(): void {
    this.teacherService.getAll().subscribe({
      next: (response: any) => {
        this.teacher = response.data;
        console.log("Total Teachers:", this.teacher.length);
        this.updateCharts();
      },
      error: (error) => {
        console.error("Error loading teachers:", error);
      },
    });
  }

  // Count all parents
  countParents(): void {
    this.parentService.getAll().subscribe({
      next: (response: any) => {
        this.parents = response.data;
        console.log("Total Parents:", this.parents.length);
        this.updateCharts();
      },
      error: (error) => {
        console.error("Error loading parents:", error);
      },
    });
  }

  // Count all attendance records
  countAttendance(): void {
    this.attendanceService.getAll().subscribe({
      next: (response: any) => {
        this.attendance = response.data;
        console.log("Total Attendance Records:", this.attendance.length);
        console.log("Sample attendance record:", this.attendance[0]);
        this.updateAttendanceCharts();
      },
      error: (error) => {
        console.error("Error loading attendance:", error);
      },
    });
  }

  // Today Attendance
  loadTodayAttendance(): void {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.todayAttendance = response.data;
        console.log("Today's attendance:", this.todayAttendance);
        this.updateCharts();
        this.updateAttendanceCharts();
      },
      error: (error) => {
        console.error("Error loading today's attendance:", error);
      },
    });
  }

  // Load all leave requests
  loadLeaveRequests(): void {
    this.leaveRequestService.getAll(undefined, 'approved').subscribe({
      next: (response: any) => {
        this.leaveRequests = response.data || [];
        console.log('Leave requests loaded:', this.leaveRequests.length);
        this.updateAttendanceCharts();
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
      },
    });
  }

  // Update charts with real data
  updateCharts(): void {
    const studentCount = this.students.length;
    const teacherCount = this.teacher.length;
    const parentCount = this.parents.length;

    // Count unique students who have attendance today (not raw records)
    const todayStudentIds = new Set<string>();
    this.todayAttendance.forEach((record: any) => {
      const studentId = typeof record.student === 'object' ? record.student?._id : record.student;
      if (studentId) todayStudentIds.add(studentId);
    });
    const attendanceCount = todayStudentIds.size;

    console.log("Updating bar chart with:", {
      students: studentCount,
      teachers: teacherCount,
      parents: parentCount,
      attendance: attendanceCount,
    });

    // Update Bar Chart
    if (this.barChart) {
      this.barChart.data.datasets[0].data = [
        studentCount,
        teacherCount,
        parentCount,
        attendanceCount,
      ];
      this.barChart.update();
    }
  }

  // Update attendance charts
  updateAttendanceCharts(): void {
    // Calculate today's per-student status for doughnut chart
    const todayStats = this.getTodayPerStudentStats();

    // Update Doughnut Chart with per-student counts
    if (this.doughnutChart) {
      this.doughnutChart.data.datasets[0].data = [
        todayStats.present,
        todayStats.absent,
        todayStats.late,
        todayStats.onLeave,
      ];
      this.doughnutChart.update();
    }

    // Update Line Chart with status-based data
    this.updateLineChart();
  }

  /**
   * Calculate today's attendance with per-student aggregation.
   * Each student gets ONE status for the day based on worst-status-wins:
   * absent > on-leave > late > half-day > present
   */
  getTodayPerStudentStats(): { present: number; absent: number; late: number; onLeave: number } {
    const studentStatuses: { [studentId: string]: string[] } = {};

    this.todayAttendance.forEach((record: any) => {
      const studentId = typeof record.student === 'object' ? record.student?._id : record.student;
      if (!studentId) return;

      if (!studentStatuses[studentId]) studentStatuses[studentId] = [];
      studentStatuses[studentId].push(record.status || 'present');
    });

    let present = 0, absent = 0, late = 0, onLeave = 0;

    Object.values(studentStatuses).forEach((statuses) => {
      const dailyStatus = this.resolveStudentDailyStatus(statuses);
      switch (dailyStatus) {
        case 'absent': absent++; break;
        case 'on-leave': onLeave++; break;
        case 'late': late++; break;
        case 'half-day': late++; break; // count half-day as late
        default: present++; break;
      }
    });

    return { present, absent, late, onLeave };
  }

  /**
   * Resolve a student's daily status from multiple subject records.
   * Priority (worst wins): absent > on-leave > late > half-day > present
   *
   * Example:
   *  - Student has [present, present, absent] → "absent" (absent in any = absent day)
   *  - Student has [present, late, present]   → "late"
   *  - Student has [present, present, present]→ "present"
   */
  resolveStudentDailyStatus(statuses: string[]): string {
    const priorityOrder = ['absent', 'on-leave', 'late', 'half-day', 'excused', 'present'];

    for (const priority of priorityOrder) {
      if (statuses.includes(priority)) {
        return priority;
      }
    }
    return 'present';
  }

  // Update Multi-Line Chart
  updateLineChart(): void {
    const weekDays = this.getWeekDays();
    const labels = weekDays.map((date) => this.formatDateLabel(date));
    this.weekRangeLabel = this.getWeekRangeLabel(weekDays);

    const statusData = this.getWeeklyAttendanceByStatus(weekDays);

    // Calculate week summary
    this.weekSummary = {
      present: statusData.present.reduce((a, b) => a + b, 0),
      late: statusData.late.reduce((a, b) => a + b, 0),
      onLeave: statusData.onLeave.reduce((a, b) => a + b, 0),
      absent: statusData.absent.reduce((a, b) => a + b, 0),
    };

    console.log('Line chart status data (per-student):', statusData);

    if (this.lineChart) {
      this.lineChart.data.labels = labels;
      this.lineChart.data.datasets[0].data = statusData.present;
      this.lineChart.data.datasets[1].data = statusData.late;
      this.lineChart.data.datasets[2].data = statusData.onLeave;
      this.lineChart.data.datasets[3].data = statusData.absent;

      // Auto-adjust Y axis max
      const allValues = [...statusData.present, ...statusData.late, ...statusData.onLeave, ...statusData.absent];
      const maxVal = Math.max(...allValues, 0);
      const suggestedMax = Math.max(10, Math.ceil(maxVal * 1.2));
      if (this.lineChart.options.scales && this.lineChart.options.scales['y']) {
        (this.lineChart.options.scales['y'] as any).suggestedMax = suggestedMax;
      }

      this.lineChart.update();
    }
  }

  /**
   * Get weekly attendance grouped by status — PER STUDENT.
   * Each student counts as ONE entry per day with their resolved daily status.
   */
  getWeeklyAttendanceByStatus(weekDays: string[]): {
    present: number[];
    late: number[];
    onLeave: number[];
    absent: number[];
  } {
    const dailyStatuses = this.getStudentDailyStatuses();
    const leaveByDate = this.groupLeavesByDate();

    const present: number[] = [];
    const late: number[] = [];
    const onLeave: number[] = [];
    const absent: number[] = [];

    weekDays.forEach((dateStr) => {
      const dayData = dailyStatuses[dateStr] || {};
      let pCount = 0, lCount = 0, oCount = 0, aCount = 0;

      Object.values(dayData).forEach((status) => {
        switch (status) {
          case 'present': pCount++; break;
          case 'late': case 'half-day': lCount++; break;
          case 'on-leave': oCount++; break;
          case 'absent': aCount++; break;
        }
      });

      // Also count approved leaves for students not already in attendance
      const leaveCount = leaveByDate[dateStr] || 0;
      if (leaveCount > oCount) {
        oCount = leaveCount;
      }

      present.push(pCount);
      late.push(lCount);
      onLeave.push(oCount);
      absent.push(aCount);
    });

    return { present, late, onLeave, absent };
  }

  /**
   * Core function: Group attendance records by date → student → resolved daily status.
   * Returns: { "2026-02-25": { "studentId1": "present", "studentId2": "absent" } }
   */
  getStudentDailyStatuses(): {
    [date: string]: { [studentId: string]: string };
  } {
    // Step 1: Collect all statuses per student per day
    const raw: { [date: string]: { [studentId: string]: string[] } } = {};

    this.attendance.forEach((record: any) => {
      if (!record.date) return;

      const localDate = new Date(record.date);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const studentId = typeof record.student === 'object' ? record.student?._id : record.student;
      if (!studentId) return;

      const status = record.status || 'present';

      if (!raw[dateStr]) raw[dateStr] = {};
      if (!raw[dateStr][studentId]) raw[dateStr][studentId] = [];
      raw[dateStr][studentId].push(status);
    });

    // Step 2: Resolve each student's daily status (worst wins)
    const resolved: { [date: string]: { [studentId: string]: string } } = {};

    Object.keys(raw).forEach((dateStr) => {
      resolved[dateStr] = {};
      Object.keys(raw[dateStr]).forEach((studentId) => {
        resolved[dateStr][studentId] = this.resolveStudentDailyStatus(raw[dateStr][studentId]);
      });
    });

    return resolved;
  }

  // Group approved leave requests by date (count unique students on leave per day)
  groupLeavesByDate(): { [date: string]: number } {
    const grouped: { [date: string]: Set<string> } = {};

    this.leaveRequests.forEach((leave: any) => {
      if (leave.status === 'approved' && leave.fromDate && leave.toDate) {
        const studentId = typeof leave.student === 'object' ? leave.student?._id : leave.student;
        const from = new Date(leave.fromDate);
        const to = new Date(leave.toDate);
        const current = new Date(from);

        while (current <= to) {
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          if (!grouped[dateStr]) grouped[dateStr] = new Set();
          if (studentId) grouped[dateStr].add(studentId);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    // Convert Sets to counts
    const result: { [date: string]: number } = {};
    Object.keys(grouped).forEach((dateStr) => {
      result[dateStr] = grouped[dateStr].size;
    });
    return result;
  }

  // Get 7 days for the current week offset (Mon-Sun)
  getWeekDays(): string[] {
    const dates: string[] = [];
    const today = new Date();
    // Calculate the start of the current week (Monday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset + this.weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }

    return dates;
  }

  // Get a readable week range label
  getWeekRangeLabel(weekDays: string[]): string {
    if (weekDays.length === 0) return '';
    const start = this.formatDateLabel(weekDays[0]);
    const end = this.formatDateLabel(weekDays[weekDays.length - 1]);
    const [yearStr] = weekDays[0].split('-');

    if (this.weekOffset === 0) return `${start} - ${end}, ${yearStr} (This Week)`;
    if (this.weekOffset === -1) return `${start} - ${end}, ${yearStr} (Last Week)`;
    return `${start} - ${end}, ${yearStr}`;
  }

  // Navigate weeks
  navigateWeek(direction: number): void {
    this.weekOffset += direction;
    // Don't allow going into the future
    if (this.weekOffset > 0) {
      this.weekOffset = 0;
      return;
    }
    this.updateLineChart();
  }

  // Get last 7 days as array of date strings (legacy support)
  getLast7Days(): string[] {
    return this.getWeekDays();
  }

  // Format date for chart labels (e.g., "Mon 12")
  formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${dayNames[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  }

  // Review and approve leave requests (Admin only)
  reviewApprove(): void {
    this.router.navigate(["/leave-requests"]);
  }

  // Cleanup on component destroy
  ngOnDestroy(): void {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (this.lineChart) this.lineChart.destroy();
  }
}
