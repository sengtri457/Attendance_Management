import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/userservice/user.service';
import { AuthService } from '../../services/authservice/auth.service';
import { User } from '../../models/user.model';
import { finalize } from 'rxjs/operators';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  public themeService = inject(ThemeService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  user: User | null = null;
  loadingProfile = false;
  submittingProfile = false;
  submittingPassword = false;

  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmNewPassword = group.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
  }

  loadUserProfile(): void {
    this.loadingProfile = true;
    const userId = this.authService.getUserId() || (this.authService.getCurrentUser()?.id);
    
    if (userId) {
      this.userService.getById(userId).pipe(
        finalize(() => this.loadingProfile = false)
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.user = response.data;
            this.profileForm.patchValue({
              username: this.user.username,
              email: this.user.email
            });
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load user profile';
          console.error('Error loading profile:', error);
        }
      });
    } else {
      this.errorMessage = 'User ID not found';
      this.loadingProfile = false;
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.submittingProfile = true;
    this.successMessage = null;
    this.errorMessage = null;

    const userId = this.user?._id;
    if (!userId) return;

    this.userService.updateProfile(userId, this.profileForm.value).pipe(
      finalize(() => this.submittingProfile = false)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Profile updated successfully';
          this.user = { ...this.user!, ...this.profileForm.value };
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update profile';
        console.error('Error updating profile:', error);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.submittingPassword = true;
    this.passwordSuccessMessage = null;
    this.passwordErrorMessage = null;

    const userId = this.user?._id;
    if (!userId) return;

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.userService.changePassword(userId, currentPassword, newPassword).pipe(
      finalize(() => this.submittingPassword = false)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.passwordSuccessMessage = 'Password changed successfully';
          this.passwordForm.reset();
        }
      },
      error: (error) => {
        this.passwordErrorMessage = error.error?.message || 'Failed to change password';
        console.error('Error changing password:', error);
      }
    });
  }
}
