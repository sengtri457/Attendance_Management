import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { User } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getAll(): Observable<{ success: boolean; data: User[] }> {
    return this.http.get<{ success: boolean; data: User[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  update(id: string, user: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, user);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
