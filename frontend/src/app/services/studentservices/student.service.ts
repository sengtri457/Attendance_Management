import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Student } from "../../models/user.model";

// Interface for pagination response
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StudentListResponse {
  success: boolean;
  data: Student[];
  pagination: PaginationMetadata;
}

// Interface for query parameters
export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

@Injectable({
  providedIn: "root",
})
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/students`;

  // Updated getAll method with pagination and search
  getAll(params?: StudentQueryParams): Observable<StudentListResponse> {
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

    return this.http.get<StudentListResponse>(this.apiUrl, {
      params: httpParams,
    });
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

  importStudents(file: File): Observable<any> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(`${this.apiUrl}/import`, formData);
  }
}
