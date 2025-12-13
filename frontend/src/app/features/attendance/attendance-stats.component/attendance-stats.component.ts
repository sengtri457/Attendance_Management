import { Component, OnInit } from "@angular/core";
import { AttendanceStats } from "../../../models/user.model";
import { ActivatedRoute } from "@angular/router";
import { AttendanceService } from "../../../services/attendanceservice/attendance.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-attendance-stats.component",
  imports: [CommonModule, FormsModule],
  templateUrl: "./attendance-stats.component.html",
  styleUrl: "./attendance-stats.component.css",
})
export class AttendanceStatsComponent implements OnInit {
  studentId = "";
  stats: AttendanceStats | null = null;
  loading = false;
  dateFrom = "";
  dateTo = "";

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get("studentId") || "";
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.attendanceService
      .getStudentStats(this.studentId, this.dateFrom, this.dateTo)
      .subscribe({
        next: (response) => {
          this.stats = response.data;
          console.log("Stats loaded:", this.stats);
          this.loading = false;
        },
        error: (error) => {
          console.error("Error loading stats:", error);
          this.loading = false;
        },
      });
  }
}
