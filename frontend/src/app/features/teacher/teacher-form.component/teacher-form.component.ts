import { Component, inject, signal } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TeacherService } from "../../../services/teacherservice/teacher.service";
import { UserService } from "../../../services/userservice/user.service";
import { RoleService } from "../../../services/rolservices/role.service";

import { SubjectService } from "../../../services/subjectservice/subject.service";

interface Subject {
  _id: string;
  subjectName: string;
  teachTime: Date | string;
  endTime: Date | string;
  teacher?: any;
}

@Component({
  selector: "app-teacher-form.component",
  imports: [FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./teacher-form.component.html",
  styleUrl: "./teacher-form.component.css",
})
export class TeacherFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private teacherService = inject(TeacherService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private subjectService = inject(SubjectService);

  teacherForm!: FormGroup;
  isEditMode = false;
  teacherId: string | null = null;
  loading = false;
  submitting = false;
  errorMessage = "";
  teacherRoleId = "";

  // Signals for single subject selection
  allSubjects = signal<Subject[]>([]);
  filteredSubjects = signal<Subject[]>([]);
  selectedSubject = signal<string | null>(null);
  loadingSubjects = signal<boolean>(false);
  searchTerm = "";

  ngOnInit(): void {
    this.teacherId = this.route.snapshot.paramMap.get("id");
    this.isEditMode = !!this.teacherId;

    this.initForm();
    this.loadTeacherRole();
    this.loadSubjects();

    if (this.isEditMode && this.teacherId) {
      this.loadTeacher(this.teacherId);
    }
  }

  initForm(): void {
    if (this.isEditMode) {
      this.teacherForm = this.fb.group({
        name: ["", Validators.required],
        phone: [""],
        subjectId: ["", Validators.required],
      });
    } else {
      this.teacherForm = this.fb.group({
        username: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        name: ["", Validators.required],
        phone: [""],
        subjectId: ["", Validators.required],
      });
    }
  }

  loadTeacherRole(): void {
    this.roleService.getAll().subscribe({
      next: (response) => {
        const teacherRole = response.data.find(
          (r: any) => r.roleName === "Teacher",
        );
        if (teacherRole) {
          this.teacherRoleId = teacherRole._id;
        }
      },
      error: (error) => {
        console.error("Error loading roles:", error);
      },
    });
  }

  loadSubjects(): void {
    this.loadingSubjects.set(true);
    this.subjectService.getAllSubjects().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSubjects.set(response.data);
          this.filteredSubjects.set(response.data);
        }
        this.loadingSubjects.set(false);
      },
      error: (error) => {
        console.error("Error loading subjects:", error);
        this.loadingSubjects.set(false);
      },
    });
  }

  loadTeacher(id: string): void {
    this.loading = true;
    this.teacherService.getById(id).subscribe({
      next: (response: any) => {
        const teacher = response.data;
        this.teacherForm.patchValue({
          name: teacher.name,
          phone: teacher.phone || "",
          subjectId: teacher.subject?._id || teacher.subject || "",
        });
        this.selectedSubject.set(
          teacher.subject?._id || teacher.subject || null,
        );
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading teacher:", error);
        this.errorMessage = "Failed to load teacher information";
        this.loading = false;
      },
    });
  }

  // Subject selection methods
  filterSubjects(): void {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.allSubjects().filter((subject) =>
      subject.subjectName.toLowerCase().includes(term),
    );
    this.filteredSubjects.set(filtered);
  }

  selectSubject(subjectId: string): void {
    this.selectedSubject.set(subjectId);
    this.teacherForm.patchValue({ subjectId });
  }

  clearSubject(): void {
    this.selectedSubject.set(null);
    this.teacherForm.patchValue({ subjectId: "" });
  }

  isSubjectSelected(subjectId: string): boolean {
    return this.selectedSubject() === subjectId;
  }

  getSubjectName(subjectId: string): string {
    const subject = this.allSubjects().find((s) => s._id === subjectId);
    return subject?.subjectName || "";
  }

  getSelectedSubjectDetails(): Subject | null {
    const subjectId = this.selectedSubject();
    if (!subjectId) return null;
    return this.allSubjects().find((s) => s._id === subjectId) || null;
  }

  formatTime(time: Date | string): string {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.teacherForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.teacherForm.valid) {
      this.submitting = true;
      this.errorMessage = "";

      if (this.isEditMode && this.teacherId) {
        // Update existing teacher
        const updateData = {
          name: this.teacherForm.value.name,
          phone: this.teacherForm.value.phone,
          subjectId: this.teacherForm.value.subjectId,
        };
        this.teacherService.update(this.teacherId, updateData).subscribe({
          next: () => {
            console.log(updateData);
            this.router.navigate(["/teachers", this.teacherId]);
          },
          error: (error) => {
            console.error("Error updating teacher:", error);
            this.errorMessage =
              error.error?.message || "Failed to update teacher";
            this.submitting = false;
          },
        });
      } else {
        // Create new teacher - First create user, then teacher
        const { username, email, password, ...teacherData } =
          this.teacherForm.value;

        this.userService
          .create({
            username,
            email,
            password,
            roleId: this.teacherRoleId,
          })
          .subscribe({
            next: (userResponse) => {
              // Now create teacher with the user ID
              this.teacherService
                .create({
                  userId: userResponse.data._id,
                  ...teacherData,
                })
                .subscribe({
                  next: () => {
                    this.router.navigate(["/teachers"]);
                  },
                  error: (error) => {
                    console.error("Error creating teacher:", error);
                    this.errorMessage =
                      error.error?.message || "Failed to create teacher";
                    this.submitting = false;
                  },
                });
            },
            error: (error) => {
              console.error("Error creating user:", error);
              this.errorMessage =
                error.error?.message || "Failed to create user account";
              this.submitting = false;
            },
          });
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.teacherForm.controls).forEach((key) => {
        this.teacherForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(["/teachers"]);
  }
}
