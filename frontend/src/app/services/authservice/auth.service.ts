import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Load user from storage on service initialization (browser only)
    if (isPlatformBrowser(this.platformId)) {
      const user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  private getUserFromStorage(): any {
    if (!isPlatformBrowser(this.platformId)) return null;

    const user = localStorage.getItem('currentUsers');
    return user ? JSON.parse(user) : null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('tokens', response.data.tokens);
            localStorage.setItem(
              'currentUsers',
              JSON.stringify(response.data.user)
            );
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('tokens');
      localStorage.removeItem('currentUsers');
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('tokens');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserId(): string {
    const user = this.currentUserSubject.value;
    return user?._id || user?.id || '';
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }

  getStudentId(): string | null {
    const user = this.getCurrentUser();
    return user?.studentId || null;
  }

  getTeacherId(): string | null {
    const user = this.getCurrentUser();
    return user?.teacherId || null;
  }

  getParentId(): string | null {
    const user = this.getCurrentUser();
    return user?.parentId || null;
  }

  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Student';
  }

  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Teacher';
  }

  isParent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Parent';
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin';
  }
}
