import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  readonly appName = environment.appName;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  error = "";
  success = false;

  readonly form = this.fb.nonNullable.group({
    username: ["", [Validators.required, Validators.minLength(3)]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    confirmPassword: ["", [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  passwordsMatch(): boolean {
    const password = this.form.get("password")?.value;
    const confirmPassword = this.form.get("confirmPassword")?.value;
    return password === confirmPassword;
  }

  submit(): void {
    this.error = "";
    this.success = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.passwordsMatch()) {
      this.error = "Les contrassenyes no coincideixen";
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.loading = true;

    console.log("Sending registration with:", { username, password });

    this.auth
      .register(username, password, false)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          console.log("Registration successful");
          this.success = true;
          this.error = "";
          setTimeout(() => this.router.navigateByUrl("/login"), 2000);
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          console.error("Registration error:", err);
          this.error = err instanceof Error ? err.message : String(err);
          this.success = false;
          this.cdr.markForCheck();
        },
      });
  }
}
