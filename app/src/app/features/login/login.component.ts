import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  readonly appName = environment.appName;
  hidePassword = true;
  loading = false;
  error = "";

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
    demoMode: [environment.demoModeDefault],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.error = "";
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, demoMode } = this.form.getRawValue();
    this.loading = true;

    this.auth
      .login(email, password, demoMode)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl("/dashboard"),
        error: (err: unknown) => {
          this.error = err instanceof Error ? err.message : String(err);
        },
      });
  }
}
