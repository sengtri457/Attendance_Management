import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { StudentService } from '../../../services/studentservices/student.service';
import { SubjectService } from '../../../services/subjectservice/subject.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-weekly-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weekly-report.component.html',
  styleUrls: ['./weekly-report.component.css']
})
export class WeeklyReportComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private studentService = inject(StudentService);
  private subjectService = inject(SubjectService);

  students: any[] = [];
  subjects: any[] = [];
  groupedData: any[] = [];
  weekDays: Date[] = [];

  startDate: string = '';
  endDate: string = '';
  selectedSubject: string = '';
  loading = false;

  ngOnInit() {
    this.setDefaultDates();
    this.loadSubjects();
    this.generateReport();
  }

  setDefaultDates() {
    const today = new Date();
    const day = today.getDay(); 
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(today.setDate(diff));
    this.startDate = monday.toISOString().split('T')[0];

    const end = new Date(monday);
    end.setDate(end.getDate() + 6); // Sunday
    this.endDate = end.toISOString().split('T')[0];
  }

  loadSubjects() {
    // Fix: use getAllSubjects instead of getAll
    this.subjectService.getAllSubjects().subscribe({
      next: (res: any) => this.subjects = res.data || [],
      error: (err: any) => console.error(err)
    });
  }

  generateReport() {
    if (!this.startDate || !this.endDate) return;
    this.loading = true;
    this.updateWeekDays();

    // Fetch all students (max 1000 for scalability within reason)
    this.studentService.getAll({ limit: 1000 }).subscribe({
      next: (resSt: any) => {
        const allStudents = resSt.data || [];

        // Fetch attendance for the range
        this.attendanceService.getAll({
          dateFrom: this.startDate,
          dateTo: this.endDate,
          subjectId: this.selectedSubject,
          limit: 10000 
        }).subscribe({
          next: (resAtt: any) => {
            this.processData(allStudents, resAtt.data || []);
            this.loading = false;
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
            Swal.fire('Error', 'Failed to fetch attendance data', 'error');
          }
        });
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  updateWeekDays() {
    const start = new Date(this.startDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    this.weekDays = days;
  }

  processData(students: any[], attendance: any[]) {
    const studentMap = new Map();

    // Initialize map with all students
    students.forEach(stu => {
      studentMap.set(stu._id, {
        student: stu,
        days: {}, 
        summary: { P: 0, A: 0, L: 0, E: 0 }
      });
    });

    // Populate attendance
    attendance.forEach(att => {
      // Ensure student exists
      const studentId = typeof att.student === 'object' ? att.student._id : att.student;
      
      let stuData = studentMap.get(studentId);
      
      if (stuData) {
        const dateStr = new Date(att.date).toLocaleDateString('en-CA');
        
        // Determine status code
        let code = 'P';
        
        // Priority: Absent > Late > Excused > Present
        // But backend might have its own priority. We trust `att.status`.
        
        if (att.status === 'absent') code = 'A';
        else if (att.status === 'late') code = 'L';
        else if (att.status === 'excused' || att.status === 'on-leave') code = 'E';
        else if (att.status === 'half-day') code = 'HD';
        else if (att.status === 'present') code = 'P';
        
        // If multiple records for same day/student (diff subjects), how to handle?
        // We overwrite. Last record wins? Or "worst" status wins?
        // Let's implement "worst" status logic if entry exists.
        // Hierarchy: A > L > E > P
        
        const existing = stuData.days[dateStr];
        if (existing) {
             const priority: Record<string, number> = { 'A': 4, 'L': 3, 'E': 2, 'HD': 2, 'P': 1 };
             const existingPriority = priority[existing.code] || 0;
             const newPriority = priority[code] || 0;
             
             if (newPriority > existingPriority) {
                 // Update counts: remove old, add new
                 if (existing.code === 'P') stuData.summary.P--;
                 if (existing.code === 'A') stuData.summary.A--;
                 if (existing.code === 'L') stuData.summary.L--;
                 if (existing.code === 'E') stuData.summary.E--;
                 
                 stuData.days[dateStr] = { code, status: att.status };
             } else {
                 return; 
             }
        } else {
            stuData.days[dateStr] = { code, status: att.status };
        }
        
        // Update summary (for newly added or updated)
        if (code === 'P') stuData.summary.P++;
        else if (code === 'A') stuData.summary.A++;
        else if (code === 'L') stuData.summary.L++;
        else if (code === 'E') stuData.summary.E++;
      }
    });

    this.groupedData = Array.from(studentMap.values());
  }

  exportExcel() {
    const wsData = [];
    
    // Headers
    const headers = ['Student Name', 'Student ID', ...this.weekDays.map(d => d.toLocaleDateString()), 'Total Present', 'Total Absent', 'Total Late', 'Total Excused'];
    wsData.push(headers);

    // Rows
    this.groupedData.forEach(group => {
      const row = [
        `${group.student.firstName} ${group.student.lastName}`,
        group.student.studentId
      ];
      
      // Days
      this.weekDays.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const record = group.days[dateStr];
        row.push(record ? record.code : '-'); 
      });
      
      // Placeholder for totals - formulas will overwrite
      row.push(0, 0, 0, 0); 
      
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add Formulas for Totals
    // Columns: A(0), B(1), C(2)..I(8) are days (7 days). 
    // J(9)=Present, K(10)=Absent, L(11)=Late, M(12)=Excused
    // Range C{row}:I{row}
    // Row 1 is header. Data starts row 2.
    
    for (let i = 2; i <= wsData.length; i++) {
        const range = `C${i}:I${i}`;
        ws[XLSX.utils.encode_cell({c: 9, r: i-1})] = { t: 'n', f: `COUNTIF(${range}, "P")` };
        ws[XLSX.utils.encode_cell({c: 10, r: i-1})] = { t: 'n', f: `COUNTIF(${range}, "A")` };
        ws[XLSX.utils.encode_cell({c: 11, r: i-1})] = { t: 'n', f: `COUNTIF(${range}, "L")` };
        ws[XLSX.utils.encode_cell({c: 12, r: i-1})] = { t: 'n', f: `COUNTIF(${range}, "E")` };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
    XLSX.writeFile(wb, `Attendance_Weekly_${this.startDate}.xlsx`);
  }

  exportPDF() {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for weekly view
    
    const head = [['Student Name', 'ID', ...this.weekDays.map(d => d.toLocaleDateString(undefined, {weekday:'short', day:'numeric'})), 'P', 'A', 'L', 'E']];
    
    const body = this.groupedData.map(group => {
      const row = [
        `${group.student.firstName} ${group.student.lastName}`,
        group.student.studentId
      ];
      this.weekDays.forEach(d => {
        const dateStr = d.toISOString().split('T')[0];
        const record = group.days[dateStr];
        row.push(record ? record.code : '-');
      });
      row.push(group.summary.P, group.summary.A, group.summary.L, group.summary.E);
      return row;
    });

    autoTable(doc, {
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`Attendance_Weekly_${this.startDate}.pdf`);
  }
}
