
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClassGroupService } from '../../../services/class-groupservice/class-group.service';
import { ClassGroup } from '../../../models/class-group.model';
import { Student } from '../../../models/user.model';
import { AuthService } from '../../../services/authservice/auth.service';

@Component({
  selector: 'app-class-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './class-group-detail.component.html',
  styles: []
})
export class ClassGroupDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classGroupService = inject(ClassGroupService);
  private authService = inject(AuthService);

  classGroup: ClassGroup | null = null;
  students: Student[] = [];
  loading = true;
  isAdmin = false;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'Admin';

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadClassGroup(id);
      }
    });
  }

  loadClassGroup(id: string): void {
    this.loading = true;
    this.classGroupService.getClassGroupById(id).subscribe({
      next: (res) => {
        // The backend returns { ...classGroup, students: [...] }
        // So we extract students separately and keep classGroup clean if needed, 
        // or just rely on res.data having everything.
        this.classGroup = res.data;
        this.students = (res.data as any).students || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading class group details', err);
        this.loading = false;
      }
    });
  }
}
