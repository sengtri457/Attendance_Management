import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { SubjectService } from "../../../services/subjectservice/subject.service";
import { ActivatedRoute, Router } from "@angular/router";
import { DayOfWeek, Teacher } from "../../../models/user.model";
import { CommonModule } from "@angular/common";
import { TeacherService } from "../../../services/teacherservice/teacher.service";

@Component({
  selector: "app-subject-form.component",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./subject-form.component.html",
  styleUrl: "./subject-form.component.css",
})
export class SubjectFormComponent implements OnInit {
  subjectForm: FormGroup;
  isEditMode = false;
  subjectId?: string;
  loading = false;
  loadingTeachers = false;
  error = "";
  daysOfWeek = Object.values(DayOfWeek);
  teachers: Teacher[] = [];

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.subjectForm = this.fb.group({
      subjectName: ["", Validators.required],
      subjectCode: [""],
      teachTime: [""],
      endTime: [""],
      dayOfWeek: [""],
      credit: ["", [Validators.min(1), Validators.max(10)]],
      teacherId: [""],
      description: [""],
    });
  }

  ngOnInit(): void {
    // Load teachers first
    this.loadTeachers();

    // Check if we're in edit mode
    this.subjectId = this.route.snapshot.paramMap.get("id") || undefined;
    this.isEditMode = !!this.subjectId;

    if (this.isEditMode && this.subjectId) {
      this.loadSubject(this.subjectId);
    }
  }

  loadTeachers(): void {
    this.loadingTeachers = true;
    this.teacherService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teachers = response.data;
          console.log("Teachers loaded:", this.teachers);
        }
        this.loadingTeachers = false;
      },
      error: (err) => {
        console.error("Error loading teachers:", err);
        this.loadingTeachers = false;
        // Don't show error message, just log it
        // Teachers dropdown will show "No teachers available"
      },
    });
  }

  loadSubject(id: string): void {
    this.loading = true;
    this.subjectService.getSubjectById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const formData = { ...response.data };

          // Format dates for datetime-local input
          if (formData.teachTime) {
            formData.teachTime = this.formatDateForInput(
              new Date(formData.teachTime),
            );
          }
          if (formData.endTime) {
            formData.endTime = this.formatDateForInput(
              new Date(formData.endTime),
            );
          }

          this.subjectForm.patchValue(formData);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load subject";
        console.error("Error loading subject:", err);
        this.loading = false;
      },
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getTeacherName(teacher: Teacher): string {
    // Handle different possible name formats
    if (teacher.name) {
      return teacher.name;
    }
    // If name is split into firstName and lastName
    if ((teacher as any).firstName && (teacher as any).lastName) {
      return `${(teacher as any).firstName} ${(teacher as any).lastName}`;
    }
    return "Unknown Teacher";
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = "";
    const formData = this.subjectForm.value;

    if (this.isEditMode && this.subjectId) {
      this.subjectService.updateSubject(this.subjectId, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(["/subjects"]);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || "Failed to update subject";
          console.error("Error updating subject:", err);
          this.loading = false;
        },
      });
    } else {
      this.subjectService.createSubject(formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(["/subjects"]);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || "Failed to create subject";
          console.error("Error creating subject:", err);
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(["/subjects"]);
  }

  get f() {
    return this.subjectForm.controls;
  }
}
