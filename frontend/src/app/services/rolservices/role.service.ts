import { inject, Inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Role } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  getAll(): Observable<{ success: boolean; data: Role[] }> {
    return this.http.get<{ success: boolean; data: Role[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: Role }> {
    return this.http.get<{ success: boolean; data: Role }>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(role: Partial<Role>): Observable<any> {
    return this.http.post(this.apiUrl, role);
  }

  update(id: string, role: Partial<Role>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, role);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getRoleUsers(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/users`);
  }
}
