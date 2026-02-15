import { Component, OnInit, SecurityContext } from '@angular/core';
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
import { ClassGroup } from '../../../models/class-group.model';
import { ClassGroupService } from '../../../services/class-groupservice/class-group.service';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  selectedClassGroupId: string = '';
  classGroups: ClassGroup[] = [];
  
  // Teachers
  teachers: Teacher[] = [];
  selectedTeacherId: string = '';
  
  // Search
  private _searchText: string = '';
  get searchText(): string { return this._searchText; }
  set searchText(value: string) {
    this._searchText = value;
    this.currentPage = 1; // Reset to first page on search
  }

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 0;
  Math = Math; // For template access

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private classGroupService: ClassGroupService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadTeachers();
    this.loadClassGroups();
  }

  loadClassGroups(): void {
    this.classGroupService.getAllClassGroups().subscribe({
      next: (res) => {
        this.classGroups = res.data;
        if (this.classGroups.length > 0) {
           this.selectedClassGroupId = this.classGroups[0]._id || '';
           this.loadData();
        }
      },
      error: (err) => console.error('Error loading class groups', err)
    });
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
    this.currentPage = 1; // Reset pagination logic

    // 1. Get Students for selected ClassGroup
    // Use backend filtering and pagination to get all relevant students
    // 2. Get Subjects for selected ClassGroup & Date
    const subjects$ = this.subjectService.getSubjectSchedule(this.selectedDate); 

    const attendance$ = this.attendanceService.getAll({
       dateFrom: this.selectedDate, 
       dateTo: this.selectedDate 
    });

    const params: any = { limit: 100 }; // Fetch up to 100 students (reasonable for a class)
    if (this.selectedClassGroupId) {
        params.classGroupId = this.selectedClassGroupId;
    }

    this.studentService.getAll(params).subscribe({
        next: (res) => {
            // Backend now handles filtering by classGroup if provided
            this.students = res.data || [];
            
            // If fetching all classes but still want client-side safety or additional specific logic
            // (The previous client-side filter is removed as we trust the backend filter for classGroupId)

            if (this.students.length === 0) {
                this.loadingData = false;
                this.subjects = [];
                return;
            }

            // Get subjects logic remains same
            subjects$.subscribe({
                next: (subRes) => {
                    let allSubjects = subRes.data || [];
                     // Filter subjects by selected class group
                    if (this.selectedClassGroupId) {
                        allSubjects = allSubjects.filter((sub: any) => {
                            // Check legacy single class group
                            const legacyMatch = sub.classGroup && (sub.classGroup._id === this.selectedClassGroupId || sub.classGroup === this.selectedClassGroupId);
                            
                            // Check new multiple class groups
                            // Handle populated objects or raw IDs
                            const newMatch = sub.classGroups && Array.isArray(sub.classGroups) && sub.classGroups.some((group: any) => 
                                (typeof group === 'string' && group === this.selectedClassGroupId) || 
                                (group && group._id === this.selectedClassGroupId)
                            );
                            
                            return legacyMatch || newMatch;
                        });
                    }
                    this.subjects = allSubjects;
                    
                    // Fetch attendance
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

      // User requested to detect check-in time when marking, to enable later calculation
      if (status === 'present' || status === 'late') {
          request.checkInTime = new Date().toISOString();
      }

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

  get filteredStudents(): Student[] {
    if (!this._searchText) {
      return this.students;
    }
    const lower = this._searchText.toLowerCase();
    return this.students.filter(student => 
      (student.firstName && student.firstName.toLowerCase().includes(lower)) ||
      (student.lastName && student.lastName.toLowerCase().includes(lower)) ||
      (student.studentId && student.studentId.toLowerCase().includes(lower))
    );
  }

  get paginatedStudents(): Student[] {
    const filtered = this.filteredStudents;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
        this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
      if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
      }
  }

  getPages(): number[] {
      const pages: number[] = [];
      const maxButtons = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
      let end = Math.min(this.totalPages, start + maxButtons - 1);
      
      if (end - start + 1 < maxButtons) {
          start = Math.max(1, end - maxButtons + 1);
      }

      for (let i = start; i <= end; i++) {
          pages.push(i);
      }
      return pages;
  }

  highlightMatch(text: string): SafeHtml {
    if (!this.searchText || !text) return text;
    
    const pattern = this.searchText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    const regex = new RegExp(`(${pattern})`, 'gi');
    const newText = text.replace(regex, (match) => `<span class="bg-warning text-dark fw-bold px-1 rounded">${match}</span>`);
    
    return this.sanitizer.bypassSecurityTrustHtml(newText);
  }
}

