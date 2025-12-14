import { Routes } from "@angular/router";
import { authGuard } from "./core/auth/auth.guard";
import { DataComponent } from "./features/dashboard/components/data/data.component";
import { LoginComponent } from "./features/login/login.component";
import { RegisterComponent } from "./features/register/register.component";
import { ResultsComponent } from "./features/results/results.component";
import { MainLayoutComponent } from "./layout/main-layout/main-layout.component";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "data" },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  {
    path: "",
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "data", component: DataComponent },
      { path: "results", component: ResultsComponent },
    ]
  },
  { path: "**", redirectTo: "login" },
];

