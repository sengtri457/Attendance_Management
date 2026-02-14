import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClassGroupService } from '../../../services/class-groupservice/class-group.service';
import { TeacherService } from '../../../services/teacherservice/teacher.service';
import { Teacher } from '../../../models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-class-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './class-group-form.component.html',
  styles: []
})
export class ClassGroupFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private classGroupService = inject(ClassGroupService);
  private teacherService = inject(TeacherService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  classGroupForm!: FormGroup;
  teachers: Teacher[] = [];
  isEditMode = false;
  classGroupId: string | null = null;
  submitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadTeachers();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.classGroupId = id;
        this.loadClassGroup(id);
      }
    });
  }

  initForm(): void {
    this.classGroupForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      academicYear: [''],
      homeroomTeacher: [null],
      isActive: [true]
    });
  }

  loadTeachers(): void {
    this.teacherService.getAll().subscribe({
      next: (res) => {
        this.teachers = res.data;
      },
      error: (err) => {
        console.error('Error loading teachers', err);
      }
    });
  }

  loadClassGroup(id: string): void {
    this.classGroupService.getClassGroupById(id).subscribe({
      next: (res) => {
        const group = res.data;
        // If teacher is populated object, extract ID
        const teacherId = group.homeroomTeacher && typeof group.homeroomTeacher === 'object' 
          ? group.homeroomTeacher._id 
          : group.homeroomTeacher;

        this.classGroupForm.patchValue({
          name: group.name,
          description: group.description,
          academicYear: group.academicYear,
          homeroomTeacher: teacherId,
          isActive: group.isActive
        });
      },
      error: (err) => {
        console.error('Error loading class group', err);
        Swal.fire('Error', 'Failed to load class group details', 'error');
        this.router.navigate(['/class-groups']);
      }
    });
  }

  onSubmit(): void {
    if (this.classGroupForm.invalid) return;

    this.submitting = true;
    const formData = this.classGroupForm.value;

    if (this.isEditMode && this.classGroupId) {
      this.classGroupService.updateClassGroup(this.classGroupId, formData).subscribe({
        next: () => {
          this.submitting = false;
          Swal.fire('Success', 'Class group updated successfully', 'success');
          this.router.navigate(['/class-groups']);
        },
        error: (err) => {
          this.submitting = false;
          console.error('Error updating class group', err);
          Swal.fire('Error', err.error?.message || 'Failed to update class group', 'error');
        }
      });
    } else {
      this.classGroupService.createClassGroup(formData).subscribe({
        next: () => {
          this.submitting = false;
          Swal.fire('Success', 'Class group created successfully', 'success');
          this.router.navigate(['/class-groups']);
        },
        error: (err) => {
          this.submitting = false;
          console.error('Error creating class group', err);
          Swal.fire('Error', err.error?.message || 'Failed to create class group', 'error');
        }
      });
    }
  }
}
