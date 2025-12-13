import { Component, inject } from "@angular/core";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "./services/authservice/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, CommonModule, FormsModule, RouterModule],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  protected title = "frontend";
  authService = inject(AuthService);

  currentUser: any;

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
