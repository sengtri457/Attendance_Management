import { HttpClient } from "@angular/common/http";
import { inject, Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { BehaviorSubject, Observable, tap } from "rxjs";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user from storage on service initialization
    let user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  private getUserFromStorage(): any {
    if (typeof window !== "undefined" && window.localStorage) {
      const user = localStorage.getItem("currentUsers");
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success) {
            localStorage.setItem("tokens", response.data.tokens);
            localStorage.setItem(
              "currentUsers",
              JSON.stringify(response.data.user),
            );
            this.currentUserSubject.next(response.data.user);
          }
        }),
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    localStorage.removeItem("tokens");
    localStorage.removeItem("currentUsers");
    this.currentUserSubject.next(null);
    this.router.navigate(["/auth/login"]);
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("tokens");
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  // Get current user ID
  getUserId(): string {
    const user = this.currentUserSubject.value;
    return user?._id || user?.id || "";
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }

  // Get student ID if user is a student
  getStudentId(): string | null {
    const user = this.getCurrentUser();
    return user?.studentId || null;
  }

  // Get teacher ID if user is a teacher
  getTeacherId(): string | null {
    const user = this.getCurrentUser();
    return user?.teacherId || null;
  }

  // Get parent ID if user is a parent
  getParentId(): string | null {
    const user = this.getCurrentUser();
    return user?.parentId || null;
  }

  // Check if current user is a student
  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "Student";
  }

  // Check if current user is a teacher
  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "Teacher";
  }

  // Check if current user is a parent
  isParent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "Parent";
  }

  // Check if current user is an admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "Admin";
  }
}
