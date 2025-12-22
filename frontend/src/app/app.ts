import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/authservice/auth.service';
import { StudentService } from './services/studentservices/student.service';
import { LeaveRequestService } from './services/leaveRequestservice/leave-request.service';
import { LeaveRequest } from './models/user.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'frontend';
  authService = inject(AuthService);
  studentService = inject(StudentService);
  private leaveRequestService = inject(LeaveRequestService);
  leaveRequests: LeaveRequest[] = [];

  currentUser: any;
  sidebarCollapsed = false;
  userMenuOpen = false;
  studentData: any;
  studentId: string | null = null;

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.studentId = this.authService.getStudentId();
    this.loadStudent();
    this.loadLeaveRequests();
  }
  ngOnInit(): void {}
  loadLeaveRequests(): void {
    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
        console.log(this.leaveRequests);
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
      },
    });
  }

  get pendingCount(): number {
    return this.leaveRequests.filter((r) => r.status === 'pending').length;
  }
  loadStudent() {
    this.studentService.getById(this.studentId || '').subscribe({
      next: (response: any) => {
        this.studentData = response.data;
        console.log(this.studentData);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }
}
