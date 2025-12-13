import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Parent } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class ParentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/parents`;

  getAll(): Observable<{ success: boolean; data: Parent[] }> {
    return this.http.get<{ success: boolean; data: Parent[] }>(this.apiUrl);
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
