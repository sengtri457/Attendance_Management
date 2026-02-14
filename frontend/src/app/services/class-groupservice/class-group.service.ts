import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClassGroup } from '../../models/class-group.model';

@Injectable({
  providedIn: 'root'
})
export class ClassGroupService {
  private apiUrl = `${environment.apiUrl}/class-groups`;

  constructor(private http: HttpClient) { }

  createClassGroup(data: ClassGroup): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getAllClassGroups(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getClassGroupById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateClassGroup(id: string, data: Partial<ClassGroup>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteClassGroup(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
