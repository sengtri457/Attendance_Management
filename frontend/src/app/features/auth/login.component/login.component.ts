import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/authservice/auth.service';
import { CountService } from '../../../service/count.service';
import { StudentService } from '../../../services/studentservices/student.service';

@Component({
  selector: 'app-login.component',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private studentInfo = inject(CountService);
  private studentservice = inject(StudentService);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  studentData = signal<any>({});
  studentId: string | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.studentId = this.authService.getStudentId();
  }
  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        },
      });
    }
  }
}
