import { Component, inject, OnInit } from '@angular/core';
import { LeaveRequestService } from '../../../services/leaveRequestservice/leave-request.service';
import { AuthService } from '../../../services/authservice/auth.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CountService } from '../../../service/count.service';

@Component({
  selector: 'app-leave-request-form.component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './leave-request-form.component.html',
  styleUrl: './leave-request-form.component.css',
})
export class LeaveRequestFormComponent implements OnInit {
  private leaveService = inject(LeaveRequestService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public refreshPage = inject(CountService);

  leaveForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  studentId: string = '';
  minDate: string = '';
  calculatedDays: number = 0;
  isTeacher = false;
  isAdmin = false;
  leaveRequests: any;
  ngOnInit() {
    // Get current student ID from auth service
    const currentUser = this.authService.getCurrentUser();
    this.studentId = currentUser?.id || '';

    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.isTeacher = this.authService.isTeacher();
    this.isAdmin = this.authService.isAdmin();
    this.isAdmin = currentUser?.role === 'admin';

    this.initForm();
  }

  initForm() {
    this.leaveForm = this.fb.group({
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      reason: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
    });

    // Subscribe to date changes to calculate days
    this.leaveForm
      .get('fromDate')
      ?.valueChanges.subscribe(() => this.calculateDays());
    this.leaveForm
      .get('toDate')
      ?.valueChanges.subscribe(() => this.calculateDays());
  }

  calculateDays() {
    const fromDate = this.leaveForm.get('fromDate')?.value;
    const toDate = this.leaveForm.get('toDate')?.value;

    if (fromDate && toDate) {
      this.calculatedDays = this.leaveService.calculateLeaveDays(
        fromDate,
        toDate
      );
    } else {
      this.calculatedDays = 0;
    }
  }
  loadLeaveRequests(): void {
    this.loading = true;
    this.leaveService.getLeaveRequests().subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
        console.log(this.leaveRequests);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
        this.loading = false;
      },
    });
  }
  onSubmit() {
    if (this.leaveForm.invalid) {
      this.markFormGroupTouched(this.leaveForm);
      return;
    }

    const { fromDate, toDate, reason } = this.leaveForm.value;

    // Validate dates
    const validation = this.leaveService.validateDates(fromDate, toDate);
    if (!validation.isValid) {
      this.error = validation.error || 'Invalid dates';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.leaveService
      .create({
        studentId: this.studentId,
        fromDate,
        toDate,
        reason,
      })
      .subscribe({
        next: (response) => {
          this.success =
            'Leave request submitted successfully! Waiting for approval.';
          this.leaveForm.reset();
          this.review();
          this.calculatedDays = 0;
          this.loading = false;
          console.log(response);
          this.refreshPage.refresh();
        },
        error: (err) => {
          console.error('Error submitting leave request:', err);
          this.error = err.error?.message || 'Failed to submit leave request';
          this.loading = false;
        },
      });
  }

  onCancel() {
    this.router.navigate(['/leave-requests/my-requests']);
  }

  review() {
    if (this.isTeacher) {
      this.router.navigate(['/leave/review']);
    } else if (this.isAdmin) {
      setTimeout(() => {
        this.router.navigate(['/leave/review']);
      }, 2000);
    } else {
      setTimeout(() => {
        this.router.navigate(['/leave/review']);
      }, 2000);
    }
    this.loadLeaveRequests();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.leaveForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.leaveForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength'])
        return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
      if (field.errors['maxlength'])
        return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }
}
