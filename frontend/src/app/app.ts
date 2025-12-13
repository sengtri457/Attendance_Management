import { Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/authservice/auth.service';
import { StudentService } from './services/studentservices/student.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'frontend';
  authService = inject(AuthService);
  studentService = inject(StudentService);
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
