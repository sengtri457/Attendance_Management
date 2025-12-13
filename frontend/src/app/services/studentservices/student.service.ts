import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Student } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/students`;

  getAll(): Observable<{ success: boolean; data: Student[] }> {
    return this.http.get<{ success: boolean; data: Student[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Student }> {
    return this.http.get<{ success: boolean; data: Student }>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(student: Partial<Student>): Observable<any> {
    return this.http.post(this.apiUrl, student);
  }

  update(id: string, student: Partial<Student>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, student);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getParents(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/parents`);
  }
}
