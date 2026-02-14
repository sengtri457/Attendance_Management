import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClassGroupService } from '../../../services/class-groupservice/class-group.service';
import { ClassGroup } from '../../../models/class-group.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-class-group-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './class-group-list.component.html',
  styles: []
})
export class ClassGroupListComponent implements OnInit {
  private classGroupService = inject(ClassGroupService);
  
  classGroups: ClassGroup[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadClassGroups();
  }

  loadClassGroups(): void {
    this.loading = true;
    this.classGroupService.getAllClassGroups().subscribe({
      next: (res) => {
        this.classGroups = res.data;
        console.log(this.classGroups);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading class groups', err);
        this.loading = false;
        Swal.fire('Error', 'Failed to load class groups', 'error');
      }
    });
  }

  deleteClassGroup(id: string | undefined): void {
    if (!id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.classGroupService.deleteClassGroup(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Class group has been deleted.', 'success');
            this.loadClassGroups();
          },
          error: (err) => {
            console.error('Error deleting class group', err);
            Swal.fire('Error', 'Failed to delete class group', 'error');
          }
        });
      }
    });
  }
}
