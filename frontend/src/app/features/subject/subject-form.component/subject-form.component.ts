import { Component, OnInit } from "@angular/core";
import {
  FormArray,
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
import { ClassGroupService } from "../../../services/class-groupservice/class-group.service";
import { ClassGroup } from "../../../models/class-group.model";

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
  classGroups: ClassGroup[] = [];

  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private classGroupService: ClassGroupService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.subjectForm = this.fb.group({
      subjectName: ["", Validators.required],
      subjectCode: [""],
      // Legacy fields - keeping for now or we can migrate
      teachTime: [""],
      endTime: [""],
      dayOfWeek: [""],
      credit: ["", [Validators.min(1), Validators.max(10)]],
      teacherId: [""],
      classGroup: [null], // Legacy single select
      classGroups: [[]],  // New multi-select
      sessions: this.fb.array([]), // New sessions
      description: [""],
    });
  }

  ngOnInit(): void {
    // Load teachers first
    this.loadTeachers();
    this.loadClassGroups();

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

  loadClassGroups(): void {
    this.classGroupService.getAllClassGroups().subscribe({
      next: (res) => {
        this.classGroups = res.data;
      },
      error: (err) => console.error("Error loading class groups", err),
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
          
          // Patch classGroups
          if (formData.classGroups) {
             this.subjectForm.patchValue({ classGroups: formData.classGroups });
          }

          // Patch sessions
          if (formData.sessions && Array.isArray(formData.sessions)) {
              const sessionsFormArray = this.subjectForm.get('sessions') as FormArray;
              sessionsFormArray.clear();
              formData.sessions.forEach((session: any) => {
                  sessionsFormArray.push(this.fb.group({
                      days: [session.days || (session.dayOfWeek ? [session.dayOfWeek] : []), Validators.required],
                      startTime: [session.startTime, Validators.required],
                      endTime: [session.endTime, Validators.required],
                      room: [session.room]
                  }));
              });
          }
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

  // Session Management
  get sessions() {
      return this.subjectForm.get('sessions') as FormArray;
  }

  addSession() {
      const sessionGroup = this.fb.group({
          days: [[], Validators.required],
          startTime: ['', Validators.required],
          endTime: ['', Validators.required],
          room: ['']
      });
      this.sessions.push(sessionGroup);
  }

  removeSession(index: number) {
      this.sessions.removeAt(index);
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
    
    // Get form value
    const formValue = this.subjectForm.value;

    // Create a clean payload to send to backend
    // Explicitly ensure classGroups is an array and clear legacy classGroup field
    const payload = {
      ...formValue,
      classGroups: Array.isArray(formValue.classGroups) ? formValue.classGroups : [],
      classGroup: null // Ensure legacy field doesn't interfere
    };

    console.log('Submitting subject payload:', payload);

    if (this.isEditMode && this.subjectId) {
      this.subjectService.updateSubject(this.subjectId, payload).subscribe({
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
      this.subjectService.createSubject(payload).subscribe({
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
