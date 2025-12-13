import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

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
    MatIconModule
  ],
  template: `
    <div class="flex h-screen flex-col bg-gray-50">
      <!-- Header -->
      <mat-toolbar color="primary" class="!bg-blue-600 !text-white shadow-md z-10 relative px-6">
        <span class="font-bold text-xl tracking-tight mr-8">{{ appName }}</span>
        
        <!-- Navigation -->
        <nav class="flex gap-4">
          <a routerLink="/analyze" 
             routerLinkActive="bg-blue-700" 
             class="px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors text-white no-underline">
            Analyze
          </a>
          <a routerLink="/results" 
             routerLinkActive="bg-blue-700" 
             class="px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors text-white no-underline">
            Results
          </a>
        </nav>

        <span class="flex-1"></span>
        
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

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
