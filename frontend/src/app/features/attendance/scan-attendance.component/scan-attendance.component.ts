import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedClassGroupId: any = '';
  selectedSubjectId: string = '';
  selectedTeacherId: string = '';

  // Data lists
  classGroups: ClassGroup[] = [];
  subjects: Subject[] = [];
  teachers: Teacher[] = [];
  students: Student[] = []; // Cache for lookup

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
    private classGroupService: ClassGroupService
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
      });
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
      
      // Validation
      if (!this.selectedSubjectId) {
          this.playErrorSound();
          this.scanStatus = 'error';
          this.scanMessage = 'Please select a subject first.';
          return;
      }

      // Find student
      // Code is assumed to be studentId or _id
      const student = this.students.find(s => s._id === code || s.studentId === code);
      
      if (!student) {
          this.playErrorSound();
          this.scanStatus = 'error';
          this.scanMessage = 'Student not found in this class.';
          return;
      }

      this.lastScannedStudent = student;
      
      // Mark Attendance
      const request: MarkAttendanceRequest = {
          studentId: student._id,
          subjectId: this.selectedSubjectId,
          date: this.selectedDate,
          status: 'present',
          markedByTeacherId: this.selectedTeacherId
      };

      this.attendanceService.mark(request).subscribe({
          next: () => {
              this.playSuccessSound();
              this.scanStatus = 'success';
              this.scanMessage = `Marked Present: ${student.firstName} ${student.lastName}`;
              
              // Clear last result after delay to allow re-scan if needed (though usually once per session)
              setTimeout(() => this.lastResultString = '', 3000);
          },
          error: (err) => {
              this.playErrorSound();
              this.scanStatus = 'error';
              this.scanMessage = 'Failed to mark attendance. Try again.';
          }
      });
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
