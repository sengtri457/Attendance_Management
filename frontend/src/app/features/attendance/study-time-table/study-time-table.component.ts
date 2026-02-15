import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { Student } from '../../../models/user.model';
import { StudentService } from '../../../services/studentservices/student.service';

interface StudySession {
  subjectName: string;
  checkIn: string;
  checkOut: string | null;
  durationMinutes: number;
  status: string;
}

@Component({
  selector: 'app-study-time-table',
  imports: [CommonModule, RouterModule],
  templateUrl: './study-time-table.component.html',
  styleUrl: './study-time-table.component.css',
  standalone: true,
  providers: [DatePipe, DecimalPipe]
})
export class StudyTimeTableComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private attendanceService = inject(AttendanceService);
  private studentService = inject(StudentService);

  studentId: string = '';
  date: string = '';
  student: Student | null = null;
  
  loading: boolean = true;
  totalStudyMinutes: number = 0;
  sessions: StudySession[] = [];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.studentId = params['studentId'];
      this.date = params['date'] || new Date().toISOString().split('T')[0];
      
      if (this.studentId) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    
    // Load student details
    this.studentService.getById(this.studentId).subscribe(res => {
        this.student = res.data || res;
    });

    // Load attendance for the day
    this.attendanceService.getAll({
      studentId: this.studentId,
      dateFrom: this.date,
      dateTo: this.date
    }).subscribe({
      next: (res) => {
        const records = res.data;
        this.processRecords(records);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  processRecords(records: any[]) {
    this.sessions = records.map(r => {
      let duration = 0;
      if (r.checkInTime && r.checkOutTime) {
        const start = new Date(r.checkInTime).getTime();
        const end = new Date(r.checkOutTime).getTime();
        duration = Math.round((end - start) / 60000);
      } else if (r.workHours) {
          duration = Math.round(r.workHours * 60);
      }

      return {
        subjectName: r.subject ? r.subject.subjectName : 'Daily Check-in',
        checkIn: r.checkInTime,
        checkOut: r.checkOutTime,
        durationMinutes: duration,
        status: r.status
      };
    });

    this.totalStudyMinutes = this.sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }
}
