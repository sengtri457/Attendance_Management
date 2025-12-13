import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import {
  ApiResponse,
  CreateSubjectDto,
  Subject,
  UpdateSubjectDto,
} from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/subjects`;
  getAllSubjects(): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(this.apiUrl);
  }

  getSubjectById(id: string): Observable<ApiResponse<Subject>> {
    return this.http.get<ApiResponse<Subject>>(`${this.apiUrl}/${id}`);
  }

  createSubject(subject: Subject): Observable<ApiResponse<Subject>> {
    return this.http.post<ApiResponse<Subject>>(this.apiUrl, subject);
  }

  updateSubject(
    id: string,
    subject: Partial<Subject>,
  ): Observable<ApiResponse<Subject>> {
    return this.http.put<ApiResponse<Subject>>(`${this.apiUrl}/${id}`, subject);
  }

  deleteSubject(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getSubjectsByTeacher(teacherId: string): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(
      `${this.apiUrl}/teacher/${teacherId}`,
    );
  }

  getSubjectSchedule(date?: string): Observable<ApiResponse<Subject[]>> {
    let params = new HttpParams();
    if (date) {
      params = params.set("date", date);
    }
    return this.http.get<ApiResponse<Subject[]>>(`${this.apiUrl}/schedule`, {
      params,
    });
  }
}
