import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ParentService } from "../../../services/parentservice/parent.service";
import { UserService } from "../../../services/userservice/user.service";
import { RoleService } from "../../../services/rolservices/role.service";

import { StudentService } from "../../../services/studentservices/student.service";
import { Student } from "../../../models/user.model";

@Component({
  selector: "app-parent-form.component",
  imports: [FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./parent-form.component.html",
  styleUrl: "./parent-form.component.css",
})
export class ParentFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private parentService = inject(ParentService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private studentService = inject(StudentService);
  parentForm!: FormGroup;
  isEditMode = false;
  parentId: string | null = null;
  loading = false;
  submitting = false;
  errorMessage = "";
  parentRoleId = "";
  availableStudents: Student[] = [];
  selectedStudentId = "";
  ngOnInit(): void {
    this.parentId = this.route.snapshot.paramMap.get("id");
    this.isEditMode = !!this.parentId;
    this.loadAvailableStudents();
    this.initForm();
    this.loadParentRole();

    if (this.isEditMode && this.parentId) {
      this.loadParent(this.parentId);
    }
  }

  initForm(): void {
    if (this.isEditMode) {
      this.parentForm = this.fb.group({
        name: ["", Validators.required],
        phone: [""],
      });
    } else {
      this.parentForm = this.fb.group({
        username: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        name: ["", Validators.required],
        phone: [""],
      });
    }
  }

  loadParentRole(): void {
    this.roleService.getAll().subscribe({
      next: (response) => {
        const parentRole = response.data.find(
          (r: any) => r.roleName === "Parent",
        );
        if (parentRole) {
          this.parentRoleId = parentRole._id;
        }
      },
      error: (error) => {
        console.error("Error loading roles:", error);
      },
    });
  }

  loadParent(id: string): void {
    this.loading = true;
    this.parentService.getById(id).subscribe({
      next: (response) => {
        const parent = response.data;
        this.parentForm.patchValue({
          name: parent.name,
          phone: parent.phone || "",
        });
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading parent:", error);
        this.errorMessage = "Failed to load parent information";
        this.loading = false;
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.parentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  loadAvailableStudents(): void {
    this.studentService.getAll().subscribe({
      next: (response) => {
        this.availableStudents = response.data;
      },
      error: (error) => {
        console.error("Error loading students:", error);
      },
    });
  }

  onSubmit(): void {
    if (this.parentForm.valid) {
      this.submitting = true;
      this.errorMessage = "";

      if (this.isEditMode && this.parentId) {
        const updateData = this.parentForm.value;
        this.parentService.update(this.parentId, updateData).subscribe({
          next: () => {
            this.router.navigate(["/parents", this.parentId]);
          },
          error: (error) => {
            console.error("Error updating parent:", error);
            this.errorMessage =
              error.error?.message || "Failed to update parent";
            this.submitting = false;
          },
        });
      } else {
        const { username, email, password, ...parentData } =
          this.parentForm.value;

        this.userService
          .create({
            username,
            email,
            password,
            roleId: this.parentRoleId,
          })
          .subscribe({
            next: (userResponse) => {
              this.parentService
                .create({
                  userId: userResponse.data._id,
                  ...parentData,
                })
                .subscribe({
                  next: () => {
                    this.router.navigate(["/parents"]);
                  },
                  error: (error) => {
                    console.error("Error creating parent:", error);
                    this.errorMessage =
                      error.error?.message || "Failed to create parent";
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
