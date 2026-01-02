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
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../services/rolservices/role.service';

@Component({
  selector: 'app-register.component',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  authservice = inject(AuthService);
  roleservice = inject(RoleService);
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  roles: any[] = [];
  isLoadingRoles = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        roleId: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoadingRoles = true;
    this.roleservice.getAll().subscribe({
      next: (response) => {
        this.isLoadingRoles = false;
        this.roles = response.data || response;
        this.filterRole();
        console.log(this.roles);
      },
      error: (error) => {
        this.isLoadingRoles = false;
        console.error('Failed to load roles:', error);
        this.errorMessage = 'Failed to load roles. Please refresh the page.';
      },
    });
  }

  filterRole() {
    return (this.roles = this.roles.filter(
      (role) => role.roleName === 'Student'
    ));
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authservice.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message;
          this.registerForm.reset();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
