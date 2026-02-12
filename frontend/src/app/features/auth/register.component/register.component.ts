import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/authservice/auth.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { RoleService } from '../../../services/rolservices/role.service';
import { UserService } from '../../../services/userservice/user.service';
import { StudentService } from '../../../services/studentservices/student.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-register.component',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  registerForm!: FormGroup;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  studentRoleId = '';

  ngOnInit(): void {
    this.initForm();
    this.loadStudentRole();
  }

  initForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        dob: ['', [Validators.required]],
        gender: ['', [Validators.required]],
        phone: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  loadStudentRole(): void {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (response) => {
        const studentRole = response.data.find(
          (r: any) => r.roleName === 'Student'
        );
        if (studentRole) {
          this.studentRoleId = studentRole._id;
          console.log('Student Role ID:', this.studentRoleId);
        } else {
          this.errorMessage = 'Student role not found in system';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.errorMessage = 'Failed to load roles. Please refresh the page.';
        this.loading = false;
      },
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.controls[key].markAsTouched();
      });
      return;
    }

    if (!this.studentRoleId) {
      this.errorMessage = 'Student role not found. Please refresh the page.';
      return;
    }

    this.submitting = true;

    // Create new student - First create user, then student
    const { confirmPassword, username, email, password, ...studentData } =
      this.registerForm.value;

    this.userService
      .create({
        username,
        email,
        password,
        roleId: this.studentRoleId,
      })
      .subscribe({
        next: (userResponse) => {
          console.log('User created successfully:', userResponse);

          // Now create student with the user ID
          this.studentService
            .create({
              userId: userResponse.data._id,
              ...studentData,
            })
            .subscribe({
              next: (studentResponse) => {
                this.submitting = false;
                this.successMessage =
                  'Registration successful! Redirecting to login...';
                this.registerForm.reset();
                console.log('Student created successfully:', studentResponse);
                Swal.fire({
                  title: 'Register Successful',
                  icon: 'success',
                  showClass: {
                    popup: `
      animate__animated
      animate__fadeInUp
      animate__faster
    `,
                  },
                  hideClass: {
                    popup: `
      animate__animated
      animate__fadeOutDown
      animate__faster
    `,
                  },
                });
                setTimeout(() => {
                  this.router.navigate(['/auth/login']);
                }, 2000);
              },
              error: (error) => {
                console.error('Error creating student:', error);
                this.errorMessage =
                  error.error?.message || 'Failed to create student profile';
                this.submitting = false;
              },
            });
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.errorMessage =
            error.error?.message || 'Failed to create user account';
          this.submitting = false;
        },
      });
  }
}
