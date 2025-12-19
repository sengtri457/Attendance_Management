import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Teacher } from "../../models/user.model";
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export interface TeacherQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
@Injectable({
  providedIn: "root",
})
export class TeacherService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teachers`;

  getAll(params?: TeacherQueryParams): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) {
        httpParams = httpParams.set("page", params.page.toString());
      }
      if (params.limit) {
        httpParams = httpParams.set("limit", params.limit.toString());
      }
      if (params.search) {
        httpParams = httpParams.set("search", params.search);
      }
      if (params.sortBy) {
        httpParams = httpParams.set("sortBy", params.sortBy);
      }
      if (params.sortOrder) {
        httpParams = httpParams.set("sortOrder", params.sortOrder);
      }
    }

    return this.http.get<any>(this.apiUrl, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<{ success: boolean; data: Teacher }> {
    return this.http.get<{ success: boolean; data: Teacher }>(
      `${this.apiUrl}/${id}`,
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
