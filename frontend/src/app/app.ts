import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { AuthService } from './services/authservice/auth.service';
import { StudentService } from './services/studentservices/student.service';
import { LeaveRequestService } from './services/leaveRequestservice/leave-request.service';
import { LeaveRequest } from './models/user.model';
import { CountService } from './service/count.service';
import { ThemeService } from './services/theme.service';
import 'animate.css';
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  section: 'main' | 'quick';
}

interface QuickActionsManager {
  isOpen: boolean;
  gridBtn: HTMLElement | null;
  container: HTMLElement | null;
  overlay: HTMLElement | null;
  closeBtn: HTMLElement | null;
  contentArea: HTMLElement | null;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'frontend';
  authService = inject(AuthService);
  studentService = inject(StudentService);
  count = inject(CountService);
  themeService = inject(ThemeService);
  private leaveRequestService = inject(LeaveRequestService);
  leaveRequests: LeaveRequest[] = [];

  currentUser: any;
  sidebarCollapsed = false;
  userMenuOpen = false;
  studentData = signal<any>({});
  studentId: string | null = null;
  activeDropdown: string | null = null;

  toggleDropdown(dropdown: string) {
    this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
  }
  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.studentId = this.authService.getStudentId();
    console.log(this.count.isclass);
    console.log(this.count.getCount);
  }
  ngOnInit(): void {
    this.loadLeaveRequests();
    console.log(this.count.count);
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current User:', this.currentUser);
  }
  loadLeaveRequests(): void {
    this.leaveRequestService.getLeaveRequests().subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
        console.log(this.leaveRequests
        )
        this.count.getCount(
          this.leaveRequests.filter((f) => {
            return f.status === 'pending';
          }).length
        );
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
      },
    });
  }

  get pendingCount(): number {
    return this.leaveRequests.filter((r) => r.status === 'pending').length;
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
