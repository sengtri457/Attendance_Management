import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, switchMap, catchError, of } from "rxjs";
import { Student } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class TelegramService {
  constructor(private http: HttpClient) {}

  private botToken = "7799312500:AAGV5hFLE03mdfXZGnsHQXEMB2u-jOhTe2Q";
  private chatId = "-4941908831";
  private apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
  // In your TelegramService
  sendMessage(message: string): Observable<any> {
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: "HTML",
    };
    return this.http.post(this.apiUrl, payload);
  }
  sendPhotoFromServer(photoUrl: string, caption: string): Observable<any> {
    return this.http.get(photoUrl, { responseType: "blob" }).pipe(
      switchMap((blob: Blob) => {
        // Then upload it to Telegram using FormData
        const formData = new FormData();
        formData.append("chat_id", this.chatId);
        formData.append("photo", blob, "photo.jpg");
        formData.append("caption", caption);
        formData.append("parse_mode", "HTML");

        const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
        return this.http.post(url, formData);
      }),
      catchError((error) => {
        console.error("Error sending photo:", error);
        return of({ ok: false, error: error.message });
      }),
    );
  }

  // Method to send student photo with details
  sendStudentPhoto(student: Student, date: string): Observable<any> {
    if (!student.photo) {
      return of({ ok: false, message: "No photo available" });
    }

    const formattedDate = new Date(date).toLocaleDateString();
    const dobFormatted = student.dob
      ? new Date(student.dob).toLocaleDateString()
      : "N/A";

    let caption = `👤 <b>${student.firstName} ${student.lastName}</b>\n`;
    caption += `📅 Absent on: ${formattedDate}\n`;
    caption += `🎂 DOB: ${dobFormatted}\n`;

    if (student.gender) {
      const genderIcon = student.gender.toLowerCase() === "male" ? "👨" : "👩";
      caption += `${genderIcon} ${student.gender}\n`;
    }

    if (student.phone) {
      caption += `📞 ${student.phone}\n`;
    }

    if (student.isBlacklisted) {
      caption += `⚠️ <b>BLACKLISTED</b>`;
    }

    return this.sendPhotoFromServer(student.photo, caption);
  }

  formatAbsenceMessage(data: {
    students: Student[];
    date: string;
    teacherId: string;
    note?: string;
  }): string {
    console.log("Student Data:", data);
    const formattedDate = new Date(data.date).toLocaleDateString();

    let message = `🚨 <b>Absence Report</b>\n\n`;
    message += `📅 <b>Date:</b> ${formattedDate}\n`;
    message += `👨‍🏫 <b>Teacher ID:</b> ${data.teacherId}\n`;
    message += `👥 <b>Total Absent:</b> ${data.students.length} student(s)\n`;

    if (data.note) {
      message += `📝 <b>Note:</b> ${data.note}`;
    }
    message += `\n${"=".repeat(27)}\n`;
    data.students.forEach((student, index) => {
      message += `<b>${index + 1}. ${student.firstName} ${student.lastName}</b>\n`;

      if (student.dob) {
        const dobFormatted = new Date(student.dob).toLocaleDateString();
        message += `   🎂 DOB: ${dobFormatted}\n`;
      }

      if (student.gender) {
        const genderIcon =
          student.gender.toLowerCase() === "male"
            ? "👨"
            : student.gender.toLowerCase() === "female"
              ? "👩"
              : "🧑";
        message += `   ${genderIcon} Gender: ${student.gender}\n`;
      }
      if (student.phone) {
        message += `   📞 Phone: ${student.phone}\n`;
      }
      if (student.photo) {
        message += `   📷 Photo: Available`;
      }
      message += `\n${"=".repeat(27)}`;
      message += `\n`;
    });
    const studentsWithPhotos = data.students.filter((s) => s.photo).length;
    if (studentsWithPhotos > 0) {
      message += `\n📸 <b>${studentsWithPhotos} photo(s) will be sent separately</b>`;
    }
    message += `\n${"=".repeat(27)}\n`;
    message += `⏰ Reported at: ${new Date().toLocaleString()}`;

    return message;
  }
}
