import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class BlacklistService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  // Get all active students
  getStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  // Get all blacklisted students
  getBlacklistedStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/blacklisted`);
  }

  // Soft delete student (blacklist)
  blacklistStudent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Restore student
  restoreStudent(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/restore/${id}`, {});
  }
}
