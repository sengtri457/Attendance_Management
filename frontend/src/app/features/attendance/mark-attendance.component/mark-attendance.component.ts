import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { StudentService } from '../../../services/studentservices/student.service';
import { SubjectService } from '../../../services/subjectservice/subject.service';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { Student, Teacher, Subject, Attendance, MarkAttendanceRequest } from '../../../models/user.model';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './mark-attendance.component.html',
  styleUrl: './mark-attendance.component.css',
})
export class MarkAttendanceComponent implements OnInit {
  loading = false;
  loadingData = false;
  
  // Data
  students: Student[] = [];
  subjects: Subject[] = [];
  attendanceMap: Map<string, string> = new Map(); // Key: `${studentId}_${subjectId}`, Value: status
  
  // Filters
  selectedDate: string = new Date().toISOString().split('T')[0];
  
  // Teachers
  teachers: Teacher[] = [];
  selectedTeacherId: string = '';

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadData();
  }

  loadTeachers(): void {
    this.teacherService.getAll().subscribe({
      next: (response) => {
        this.teachers = response.data || response;
        if (this.teachers.length > 0) {
            this.selectedTeacherId = this.teachers[0]._id; // Default to first teacher
        }
      },
      error: (error) => {
        console.error('Failed to load teachers:', error);
      },
    });
  }

  loadData(): void {
    this.loadingData = true;
    this.attendanceMap.clear();

    const students$ = this.studentService.getAll();
    const subjects$ = this.subjectService.getSubjectSchedule(this.selectedDate); 
    const attendance$ = this.attendanceService.getAll({
      dateFrom: this.selectedDate, 
      dateTo: this.selectedDate 
    });

    students$.subscribe({
      next: (res) => {
         this.students = res.data || res;
         
         subjects$.subscribe({
             next: (subRes) => {
                 this.subjects = subRes.data || [];
                 
                 attendance$.subscribe({
                     next: (attRes) => {
                         const attendances = attRes.data || [];
                         this.processAttendance(attendances);
                         this.loadingData = false;
                     },
                     error: (err) => {
                         console.error('Error loading attendance', err);
                         this.loadingData = false;
                     }
                 });
             },
             error: (err) => {
                 console.error('Error loading subjects', err);
                 this.loadingData = false;
             }
         });
      },
      error: (err) => {
          console.error('Error loading students', err);
          this.loadingData = false;
      }
    });
  }
  
  processAttendance(attendances: Attendance[]) {
      attendances.forEach(att => {
          if (att.student && att.subject) {
              const sId = typeof att.student === 'string' ? att.student : att.student._id;
              const subId = typeof att.subject === 'string' ? att.subject : att.subject._id;
              const key = `${sId}_${subId}`;
              this.attendanceMap.set(key, att.status);
          }
      });
  }

  onDateChange(event: any): void {
      this.selectedDate = event.target.value;
      this.loadData();
  }

  getStatus(studentId: string, subjectId: string): string {
      return this.attendanceMap.get(`${studentId}_${subjectId}`) || '';
  }

  getStudentProgress(studentId: string): 'none' | 'partial' | 'full' {
      if (this.subjects.length === 0) return 'none';
      
      let markedCount = 0;
      this.subjects.forEach(sub => {
          if (this.attendanceMap.has(`${studentId}_${sub._id}`)) {
              markedCount++;
          }
      });

      if (markedCount === 0) return 'none';
      if (markedCount === this.subjects.length) return 'full';
      return 'partial';
  }

  mark(studentId: string, subjectId: string, status: "present" | "absent" | "late" | "excused") {
      if (!this.selectedTeacherId) {
          Swal.fire('Error', 'Please select a teacher first', 'error');
          return;
      }
      
      const key = `${studentId}_${subjectId}`;
      const oldStatus = this.attendanceMap.get(key);
      
      // Toggle off if clicking same status? (Optional, user didn't ask but good UX)
      // User said "click like btn have P,L,A and E". Usually implies selection.
      
      this.attendanceMap.set(key, status);

      const request: MarkAttendanceRequest = {
          studentId,
          subjectId,
          date: this.selectedDate,
          status: status,
          markedByTeacherId: this.selectedTeacherId,
      };

      this.attendanceService.mark(request).subscribe({
          next: () => {
              // Success
          },
          error: (err) => {
              if (oldStatus) this.attendanceMap.set(key, oldStatus);
              else this.attendanceMap.delete(key);
              
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to mark attendance'
              });
          }
      });
  }
}

