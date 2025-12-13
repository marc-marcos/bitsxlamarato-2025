import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/auth/auth.service";
import { ChatbotComponent } from "./components/chatbot/chatbot.component";
import { PatientFormComponent } from "./components/patient-form/patient-form.component";
import { RiskReportComponent } from "./components/risk-report/risk-report.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ChatbotComponent,
    PatientFormComponent,
    RiskReportComponent
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {
  readonly appName = environment.appName;
  showReport = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl("/login");
  }

  onAnalyze(): void {
    this.showReport = true;
  }

  closeReport(): void {
    this.showReport = false;
  }
}
