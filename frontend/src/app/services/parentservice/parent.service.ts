import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Parent } from "../../models/user.model";
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ParentListResponse {
  success: boolean;
  data: any[]; // Replace with your Parent interface
  pagination: PaginationMetadata;
}

export interface ParentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
@Injectable({
  providedIn: "root",
})
export class ParentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/parents`;

  getAll(params?: ParentQueryParams): Observable<ParentListResponse> {
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

    return this.http.get<ParentListResponse>(this.apiUrl, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<{ success: boolean; data: Parent }> {
    return this.http.get<{ success: boolean; data: Parent }>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(parent: any): Observable<any> {
    return this.http.post(this.apiUrl, parent);
  }

  update(id: string, parent: Partial<Parent>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, parent);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getChildren(
    id: string,
  ): Observable<{ success: boolean; data: any[]; count: number }> {
    return this.http.get<{ success: boolean; data: any[]; count: number }>(
      `${this.apiUrl}/${id}/children`,
    );
  }

  addChild(parentId: string, studentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${parentId}/children`, { studentId });
  }

  removeChild(parentId: string, studentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${parentId}/children/${studentId}`);
  }
}
