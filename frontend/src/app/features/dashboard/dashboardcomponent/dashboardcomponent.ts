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
  // Create Modern Line Chart
  createLineChart(): void {
    if (!this.lineCanvas) return;

    const last7Days = this.getLast7Days();
    const labels = last7Days.map((date) => this.formatDateLabel(date));

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Attendance",
            data: [0, 1, 3, 4, 5, 6, 7, 8],
            borderColor: "rgba(99, 102, 241, 1)",
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
              gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.1)");
              gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(99, 102, 241, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgba(99, 102, 241, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 4,
            segment: {
              borderColor: (ctx) => {
                const p0Value = ctx.p0?.parsed?.y ?? 0;
                const p1Value = ctx.p1?.parsed?.y ?? 0;
                return p0Value > p1Value
                  ? "rgba(239, 68, 68, 0.8)"
                  : "rgba(99, 102, 241, 1)";
              },
            },
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
            display: true,
            text: "Attendance Trend Overview",
            font: {
              size: 20,
              weight: 700,
              family: "'Inter', 'Segoe UI', sans-serif",
            },
            color: "#111827",
            padding: { top: 15, bottom: 30 },
            align: "start",
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
                return last7Days[index];
              },
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const prev =
                  context.dataIndex > 0
                    ? (context.dataset.data[context.dataIndex - 1] as number)
                    : 0;
                const change = value - prev;
                const trend = change > 0 ? "↑" : change < 0 ? "↓" : "→";
                return [
                  `Records: ${value}`,
                  change !== 0
                    ? `${trend} ${Math.abs(change)} from previous`
                    : "",
                ].filter(Boolean);
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
              stepSize: 1,
              color: "#6b7280",
              padding: 10,
              precision: 0,
            },
            grid: {
              color: "rgba(229, 231, 235, 0.8)",
              lineWidth: 1,
              display: true,
            },
            border: {
              display: false,
            },
            title: {
              display: true,
              text: "Number of Records",
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
            title: {
              display: true,
              text: "Last 7 Days",
              font: {
                size: 13,
                weight: 600,
                family: "'Inter', 'Segoe UI', sans-serif",
              },
              color: "#374151",
              padding: { top: 10 },
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

  // Update charts with real data
  updateCharts(): void {
    const studentCount = this.students.length;
    const teacherCount = this.teacher.length;
    const parentCount = this.parents.length;
    const attendanceCount = this.todayAttendance.length;

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
    const present = this.summary?.present || 0;
    const absent = this.summary?.absent || 0;
    const late = this.summary?.late || 0;
    const onleave = this.summary?.onLeave || 0;

    // Update Doughnut Chart
    if (this.doughnutChart) {
      this.doughnutChart.data.datasets[0].data = [
        present,
        absent,
        late,
        onleave,
      ];
      this.doughnutChart.update();
    }

    // Update Line Chart with actual date-based data
    const weeklyData = this.getWeeklyAttendance();
    const last7Days = this.getLast7Days();
    const labels = last7Days.map((date) => this.formatDateLabel(date));

    console.log("Line chart data:", {
      dates: last7Days,
      labels: labels,
      counts: weeklyData,
    });

    if (this.lineChart) {
      this.lineChart.data.labels = labels;
      this.lineChart.data.datasets[0].data = weeklyData;
      this.lineChart.update();
    }
  }

  // Helper method to calculate attendance by date
  getWeeklyAttendance(): number[] {
    const attendanceByDate = this.groupAttendanceByDate();
    const last7Days = this.getLast7Days();

    console.log("Grouped attendance:", attendanceByDate);

    const weekData = last7Days.map((dateStr) => {
      return attendanceByDate[dateStr] || 0;
    });

    return weekData;
  }

  // Group attendance records by date - FIXED FOR TIMEZONE
  groupAttendanceByDate(): { [key: string]: number } {
    const grouped: { [key: string]: number } = {};

    this.attendance.forEach((record: any) => {
      if (record.date) {
        // Parse the date string directly without timezone conversion
        const dateStr = record.date.split("T")[0]; // Gets "2025-12-12" from "2025-12-12T17:00:00.000Z"

        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      }
    });

    return grouped;
  }

  // Get last 7 days as array of date strings - FIXED FOR TIMEZONE
  getLast7Days(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }

    return dates;
  }

  // Format date for chart labels (e.g., "Dec 12")
  formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
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
