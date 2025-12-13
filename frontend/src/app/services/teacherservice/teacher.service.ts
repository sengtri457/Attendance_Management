import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Teacher } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teachers`;

  getAll(): Observable<{ success: boolean; data: Teacher[] }> {
    return this.http.get<{ success: boolean; data: Teacher[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Teacher }> {
    return this.http.get<{ success: boolean; data: Teacher }>(
      `${this.apiUrl}/${id}`
    );
  }

  create(teacher: Partial<Teacher>): Observable<any> {
    return this.http.post(this.apiUrl, teacher);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  update(id: string, teacher: Partial<Teacher>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, teacher);
  }

  getSubjects(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/subjects`);
  }
}
