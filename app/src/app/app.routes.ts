import { Routes } from "@angular/router";
import { DashboardComponent } from "./features/dashboard/dashboard.component";
import { LoginComponent } from "./features/login/login.component";
import { authGuard } from "./core/auth/auth.guard";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "login" },
  { path: "login", component: LoginComponent },
  { path: "dashboard", component: DashboardComponent, canActivate: [authGuard] },
  { path: "**", redirectTo: "login" },
];

