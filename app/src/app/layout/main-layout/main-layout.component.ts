import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, throwError, timeout } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="flex h-screen flex-col bg-gray-50">
      <!-- Header -->
      <mat-toolbar color="primary" class="!bg-blue-600 !text-white shadow-md z-10 relative px-6">
        <span class="font-bold text-xl tracking-tight mr-8">{{ appName }}</span>
        
        <!-- Navigation -->
        <nav class="flex gap-4">
          <a routerLink="/data" 
             routerLinkActive="bg-blue-700" 
             class="px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors text-white no-underline">
            Dades
          </a>
          <a routerLink="/results" 
             routerLinkActive="bg-blue-700" 
             class="px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors text-white no-underline">
            Resultats
          </a>
        </nav>

        <span class="flex-1"></span>

        <button
          mat-button
          (click)="retrain()"
          [disabled]="isRetraining"
          class="!text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
          matTooltip="Reentrenar"
          aria-label="Reentrenar Model"
        >
          <span class="flex items-center gap-2">
            Reentrenar Model
            <mat-icon class="ml-2">{{ isRetraining ? 'hourglass_top' : 'model_training' }}</mat-icon>
          </span>
        </button>
        
        <button mat-icon-button (click)="logout()" class="!text-white hover:bg-blue-700 rounded-full transition-colors">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Main Content -->
      <div class="flex-1 overflow-hidden relative">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  readonly appName = environment.appName;

  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, "");
  isRetraining = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  retrain(): void {
    if (this.isRetraining) return;
    this.isRetraining = true;

    this.http
      .post<{ mensaje?: string }>(`${this.apiBaseUrl}/reEntrenar`, {})
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        catchError((err) => throwError(() => this.humanizeError(err))),
        finalize(() => {
          this.isRetraining = false;
        }),
      )
      .subscribe({
        next: (resp) => {
          const msg = typeof resp?.mensaje === 'string' && resp.mensaje.trim()
            ? resp.mensaje.trim()
            : 'Reentrenament iniciat.';
          this.snackBar.open(msg, 'OK', { duration: 4000 });
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          console.error('Error when starting retraining:', err);
          this.snackBar.open(err.message, 'Tancar', { duration: 6000 });
          this.cdr.markForCheck();
        },
      });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private humanizeError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const maybeDetail = (err.error && typeof err.error === 'object' ? (err.error as any).detail : null) as unknown;
      if (typeof maybeDetail === 'string' && maybeDetail.trim()) return new Error(maybeDetail.trim());
      const maybeMensaje = (err.error && typeof err.error === 'object' ? (err.error as any).mensaje : null) as unknown;
      if (typeof maybeMensaje === 'string' && maybeMensaje.trim()) return new Error(maybeMensaje.trim());
      if (err.status === 401) return new Error('No autoritzat. Inicia sessió de nou.');
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error('No s\'ha pogut connectar amb el backend.');
    }
    if (err instanceof Error) return err;
    return new Error('Error inesperat.');
  }
}
