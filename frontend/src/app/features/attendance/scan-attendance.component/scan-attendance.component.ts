import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';
import { AttendanceService } from '../../../services/attendanceservice/attendance.service';
import { StudentService } from '../../../services/studentservices/student.service';
import { SubjectService } from '../../../services/subjectservice/subject.service';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { ClassGroupService } from '../../../services/class-groupservice/class-group.service';
import { Student, Subject, Teacher, MarkAttendanceRequest } from '../../../models/user.model';
import { ClassGroup } from '../../../models/class-group.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-scan-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZXingScannerModule],
  templateUrl: './scan-attendance.component.html',
  styleUrl: './scan-attendance.component.css'
})
export class ScanAttendanceComponent implements OnInit {
  @ViewChild('scanner', { static: false }) scanner: ZXingScannerComponent | undefined;

  allowedFormats = [BarcodeFormat.QR_CODE];
  
  // Selection
  isDailyMode: boolean = false; // Toggle for Subject vs Daily Check-in/out
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedClassGroupId: any = '';
  selectedSubjectId: string = '';
  selectedTeacherId: string = '';

  // Data lists
  classGroups: ClassGroup[] = [];
  subjects: Subject[] = [];
  teachers: Teacher[] = [];
  students: Student[] = []; // Cache for lookup
  detectedSubject: Subject | undefined; // For UI feedback in Daily Mode
  lastAttendanceStatus: string = ''; // To control UI style (Present vs Late)

  // Scanning State
  hasDevices: boolean = false;
  hasPermission: boolean = false;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  availableDevices: MediaDeviceInfo[] = [];
  isScanning: boolean = true;
  lastResultString: string = '';
  
  // Feedback
  scanStatus: 'idle' | 'success' | 'error' | 'warning' = 'idle';
  scanMessage: string = 'Ready to scan';
  lastScannedStudent: Student | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private classGroupService: ClassGroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClassGroups();
    // Preload students? Or load on demand? Better preload for speed.
    // Ideally we filter students by class group first.
  }

  loadTeachers() {
    this.teacherService.getAll().subscribe(res => {
      this.teachers = res.data || res;
      if (this.teachers.length > 0) this.selectedTeacherId = this.teachers[0]._id;
    });
  }

  loadClassGroups() {
    this.classGroupService.getAllClassGroups().subscribe(res => {
      this.classGroups = res.data;
      if (this.classGroups.length > 0) {
        this.selectedClassGroupId = this.classGroups[0]._id;
        this.onClassChange();
      }
    });
  }

  onClassChange() {
    this.loadSubjects();
    this.loadStudents();
  }

  loadSubjects() {
      // Fetch schedule for date
      this.subjectService.getSubjectSchedule(this.selectedDate).subscribe(res => {
          let all = res.data || [];
          // Filter by class group
          if(this.selectedClassGroupId) {
              all = all.filter((s:any) => {
                 const legacy = s.classGroup && (s.classGroup._id === this.selectedClassGroupId || s.classGroup === this.selectedClassGroupId);
                 const multiple = s.classGroups && Array.isArray(s.classGroups) && s.classGroups.some((id:any) => 
                    (typeof id === 'string' && id === this.selectedClassGroupId) || (id._id === this.selectedClassGroupId));
                 return legacy || multiple;
              });
          }
          this.subjects = all;
          if(this.subjects.length > 0) this.selectedSubjectId = this.subjects[0]._id;
          this.updateDetectedSubject();
      });
  }

  updateDetectedSubject() {
    this.detectedSubject = this.getActiveSubject();
  }

  loadStudents() {
      this.studentService.getAll().subscribe(res => {
          const all = res.data || res;
          if(this.selectedClassGroupId) {
              this.students = all.filter((s:any) => s.classGroup === this.selectedClassGroupId || (s.classGroup && s.classGroup._id === this.selectedClassGroupId));
          } else {
              this.students = all;
          }
      });
  }

  toggleMode() {
      this.isDailyMode = !this.isDailyMode;
      this.scanStatus = 'idle';
      this.lastResultString = '';
      this.scanMessage = 'Ready to scan';
      this.selectedSubjectId = ''; // Reset subject selection
      if (this.isDailyMode) {
          this.updateDetectedSubject();
      }
  }

  // Scanner Events
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    if (this.availableDevices.length > 0 && !this.currentDevice) {
        // Auto-select: Prefer real cameras over virtual/OBS
        const bestDevice = devices.find(d => !/virtual|obs/i.test(d.label)) || devices[0];
        this.selectDevice(bestDevice);
    }
  }

  onPermissionResponse(permission: boolean): void {
    this.hasPermission = permission;
  }

  selectDevice(device: MediaDeviceInfo) {
      if(!device) return;
      if(this.currentDevice && device.deviceId === this.currentDevice.deviceId) {
          return; 
      }
      
      this.currentDevice = undefined; // Unmount first
      setTimeout(() => {
          this.currentDevice = device; // Remount with new device
      }, 200);
  }

  handleScanError(error: any): void {
      console.error('Scan error:', error);
      // Don't show UI error for every transient frame error, but log it.
      // If it's a permission error or critical, user will see status via other flags.
  }

  handleQrCodeResult(resultString: string): void {
      if(!resultString || (resultString === this.lastResultString && this.scanStatus === 'success')) {
          // Debounce same code
          return; 
      }
      
      this.lastResultString = resultString;
      this.processScan(resultString);
  }

  processScan(code: string) {
      // Reset status
      this.scanStatus = 'idle';
      this.lastAttendanceStatus = '';
      
      // Validation
      
      // Validation
      if (!this.isDailyMode && !this.selectedSubjectId) {
          this.playErrorSound();
          this.scanStatus = 'error';
          this.scanMessage = 'Please select a subject first.';
          return;
      }

      // Find student
      // Code is assumed to be studentId or _id; also check cached list if available, else maybe need API lookup if "Daily Mode" allows any student?
      // For now, assuming student is in the loaded list (filtered by class group if selected, or we might need to load all students for Daily Mode if Class Group is ignored?)
      // User said "not care about subject", implies maybe "not care about class group" either for check-in?
      // But typically check-in is done at school gate?
      // Let's search in currently loaded students. Ideally user selects "All Classes" or specific class.
      
      const student = this.students.find(s => s._id === code || s.studentId === code);
      
      if (!student) {
        // If daily mode, maybe we should try to look up student by ID from backend if not in local list?
        // But for simplicity, assume user selected correct Class Group or "All" (if we supported loading all).
        // For now, stick to local filtered list.
          this.playErrorSound();
          this.scanStatus = 'error';
          this.scanMessage = 'Student not found in selected list.';
          return;
      }

      this.lastScannedStudent = student;

      if (this.isDailyMode) {
          this.processDailyAttendance(student);
      } else {
          this.processSubjectAttendance(student);
      }
  }

  processSubjectAttendance(student: Student) {
      // Mark Attendance (Subject Mode)
      const request: MarkAttendanceRequest = {
          studentId: student._id,
          subjectId: this.selectedSubjectId,
          date: this.selectedDate,
          // status: 'present', // Let backend calculate status based on time
          markedByTeacherId: this.selectedTeacherId
      };
      (request as any).checkInTime = new Date().toISOString();

      this.attendanceService.mark(request).subscribe({
          next: (res) => {
              this.playSuccessSound();
              this.scanStatus = 'success';
              const status = res.data?.status || 'PRESENT';
              this.lastAttendanceStatus = status.toLowerCase(); // Capture status for UI styling
              this.scanMessage = `Marked ${status.toUpperCase()}: ${student.firstName} ${student.lastName}`;
              setTimeout(() => this.lastResultString = '', 3000);
          },
          error: (err) => {
              this.playErrorSound();
              this.scanStatus = 'error';
              this.scanMessage = 'Failed to mark attendance. Try again.';
          }
      });
  }

  processDailyAttendance(student: Student) {
      this.attendanceService.getAll({
          studentId: student._id,
          dateFrom: this.selectedDate,
          dateTo: this.selectedDate
      }).subscribe({
          next: (res) => {
              const records = res.data;
              let activeSubject = this.getActiveSubject();
              let targetSubjectId = activeSubject ? activeSubject._id : undefined;

              // 1. Try to find record for the MATCHED subject (if any)
              let recordForSubject = targetSubjectId ? records.find(r => r.subject && (r.subject._id === targetSubjectId || r.subject === targetSubjectId)) : undefined;

              // 2. Fallback: Find any record if we are just checking out generic "Daily" (no active subject) or fallback logic
              // If no specific subject detected, we treat "Any Record" as the check-in to be closed (Checkout whole day)
              let anyLastRecord = records.length > 0 ? records[records.length - 1] : undefined;

              const nowTime = new Date().toISOString();

              if (targetSubjectId && !recordForSubject) {
                  // Case A: Detected Active Subject, but no record for it yet. -> CHECK IN for Subject
                  this.createAttendanceRecord(student, targetSubjectId, nowTime, `Checked IN: ${activeSubject?.subjectName}`);
              } else if (!targetSubjectId && !anyLastRecord) {
                   // Case B: No subject detected, No prior record. -> CHECK IN Daily (Gate)
                   this.createAttendanceRecord(student, undefined, nowTime, `Checked IN: Daily (No Subject)`);
              } else {
                  // Case C: Record exists (either for this subject, or any subject if we are in 'no subject' time).
                  // -> CHECK OUT / UPDATE CHECK OUT
                  // If we found a specific subject record, update THAT one.
                  // If we didn't find specific subject record (e.g. break time), update the LAST record (Whole day checkout).
                  
                  let recordToUpdate = recordForSubject || anyLastRecord;
                  
                  if (recordToUpdate) {
                      this.attendanceService.update(recordToUpdate._id, {
                          checkOutTime: nowTime
                      }).subscribe({
                          next: (updatedRecord) => {
                              this.playSuccessSound();
                              this.scanStatus = 'success';
                              // Calculate study time for feedback
                              const start = new Date(updatedRecord.data.checkInTime as string).getTime();
                              const end = new Date(updatedRecord.data.checkOutTime as string).getTime();
                              const minutes = Math.round((end - start) / 60000);
                              
                              const subjName = recordToUpdate && recordToUpdate.subject ? (recordToUpdate.subject.subjectName || 'Subject') : 'Daily';
                              this.scanMessage = `Checked OUT (${subjName}): ${minutes} mins study time. Redirecting...`;
                              
                              setTimeout(() => {
                                  this.lastResultString = '';
                                  // Navigate to study time table
                                  this.router.navigate(['/attendance/study-time'], { 
                                    queryParams: { 
                                      studentId: student._id, 
                                      date: this.selectedDate 
                                    } 
                                  });
                              }, 1500);
                          },
                          error: (err) => this.handleApiError(err)
                      });
                  }
              }
          },
          error: (err) => this.handleApiError(err)
      });
  }

  createAttendanceRecord(student: Student, subjectId: string | undefined, checkInTime: string, successMessage: string) {
      const request: MarkAttendanceRequest = {
          studentId: student._id,
          subjectId: subjectId,
          date: this.selectedDate,
          status: 'present',
          markedByTeacherId: this.selectedTeacherId,
      };
      (request as any).checkInTime = checkInTime;

      this.attendanceService.mark(request).subscribe({
          next: () => {
              this.playSuccessSound();
              this.scanStatus = 'success';
              this.scanMessage = successMessage;
              setTimeout(() => this.lastResultString = '', 3000);
          },
          error: (err) => this.handleApiError(err)
      });
  }

  getActiveSubject(): Subject | undefined {
      if (!this.subjects || this.subjects.length === 0) return undefined;
      const now = new Date();
      // Assume subjects loaded for selectedDate. 
      // If selectedDate is NOT today, 'now' comparison might be off unless we use time parts only. 
      // But typically scanning is for 'Today'.
      
      return this.subjects.find(s => {
          if (!s.teachTime) return false;
          // Parse teachTime. It might be full date string.
          const start = new Date(s.teachTime);
          const end = s.endTime ? new Date(s.endTime) : new Date(start.getTime() + 60*60*1000); // default 1h
          
          // Normalize to today's date for time comparison if needed, 
          // but if getSubjectSchedule returns current dates, direct comparison works.
          // Let's compare timestamps.
          return now >= start && now <= end;
      });
  }

  handleApiError(err: any) {
      this.playErrorSound();
      this.scanStatus = 'error';
      this.scanMessage = err.error?.message || 'Operation failed.';
  }

  playSuccessSound() {
      const audio = new Audio('assets/sounds/success.mp3'); // Assuming exists or fail silently
      // Synthesize beep if no file
      this.beep(600, 100, 0.1); 
  }

  playErrorSound() {
      this.beep(200, 300, 0.1);
  }

  // Simple beep function using Web Audio API
  beep(frequency: number, duration: number, volume: number) {
      try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          gainNode.gain.value = volume;
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          oscillator.start();
          setTimeout(() => {
              oscillator.stop();
          }, duration);
      } catch(e) {
          console.error("Audio API error", e);
      }
  }

  retry() {
      this.lastResultString = '';
      this.scanStatus = 'idle';
      this.scanMessage = 'Ready to scan';
  }
}
