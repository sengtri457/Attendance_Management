
import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { StudentService } from "../../../services/studentservices/student.service";
import { UserService } from "../../../services/userservice/user.service";
import { RoleService } from "../../../services/rolservices/role.service";

@Component({
  selector: "app-student-form.component",
  imports: [FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./student-form.component.html",
  styleUrl: "./student-form.component.css",
})
export class StudentFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  studentForm!: FormGroup;
  isEditMode = false;
  studentId: string | null = null;
  loading = false;
  submitting = false;
  errorMessage = "";
  studentRoleId = "";

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get("id");
    this.isEditMode = !!this.studentId;

    this.initForm();
    this.loadStudentRole();

    if (this.isEditMode && this.studentId) {
      this.loadStudent(this.studentId);
    }
  }

  initForm(): void {
    if (this.isEditMode) {
      this.studentForm = this.fb.group({
        firstName: ["", Validators.required],
        lastName: ["", Validators.required],
        dob: [""],
        gender: [""],
        phone: [""],
        photo: [""],
      });
    } else {
      this.studentForm = this.fb.group({
        username: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        firstName: ["", Validators.required],
        lastName: ["", Validators.required],
        dob: [""],
        gender: [""],
        phone: [""],
        photo: [""],
      });
    }
  }

  loadStudentRole(): void {
    this.roleService.getAll().subscribe({
      next: (response) => {
        const studentRole = response.data.find(
          (r: any) => r.roleName === "Student",
        );
        if (studentRole) {
          this.studentRoleId = studentRole._id;
        }
      },
      error: (error) => {
        console.error("Error loading roles:", error);
      },
    });
  }

  loadStudent(id: string): void {
    this.loading = true;
    this.studentService.getById(id).subscribe({
      next: (response) => {
        const student = response.data;
        this.studentForm.patchValue({
          firstName: student.firstName,
          lastName: student.lastName,
          dob: student.dob
            ? new Date(student.dob).toISOString().split("T")[0]
            : "",
          gender: student.gender || "",
          phone: student.phone || "",
          photo: student.photo || "",
        });
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading student:", error);
        this.errorMessage = "Failed to load student information";
        this.loading = false;
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.studentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      this.submitting = true;
      this.errorMessage = "";

      if (this.isEditMode && this.studentId) {
        // Update existing student
        const updateData = this.studentForm.value;
        this.studentService.update(this.studentId, updateData).subscribe({
          next: () => {
            this.router.navigate(["/students", this.studentId]);
          },
          error: (error) => {
            console.error("Error updating student:", error);
            this.errorMessage =
              error.error?.message || "Failed to update student";
            this.submitting = false;
          },
        });
      } else {
        // Create new student - First create user, then student
        const { username, email, password, ...studentData } =
          this.studentForm.value;

        this.userService
          .create({
            username,
            email,
            password,
            roleId: this.studentRoleId,
          })
          .subscribe({
            next: (userResponse) => {
              // Now create student with the user ID
              this.studentService
                .create({
                  userId: userResponse.data._id,
                  ...studentData,
                })
                .subscribe({
                  next: (studentResponse) => {
                    this.router.navigate(["/students"]);
                  },
                  error: (error) => {
                    console.error("Error creating student:", error);
                    this.errorMessage =
                      error.error?.message || "Failed to create student";
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
    }
  }
}
