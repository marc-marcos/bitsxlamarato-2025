import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-risk-report",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden h-full flex flex-col">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start shrink-0">
        <div>
          <h2 class="text-2xl font-bold m-0">Risk Analysis Report</h2>
          <p class="text-blue-100 mt-1">Generated on {{ today | date:'medium' }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8 overflow-y-auto flex-1">
        <div class="flex flex-col md:flex-row gap-8 items-center mb-8">
          <!-- Risk Meter -->
          <div class="relative w-48 h-48 flex items-center justify-center shrink-0">
            <svg class="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" stroke-width="12" fill="transparent" class="text-gray-100" />
              <circle cx="96" cy="96" r="88" stroke="currentColor" stroke-width="12" fill="transparent" 
                class="text-orange-500 drop-shadow-lg" 
                stroke-dasharray="552" 
                stroke-dashoffset="165" 
                stroke-linecap="round" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-800">
              <span class="text-5xl font-bold">72</span>
              <span class="text-sm font-medium text-orange-500 uppercase tracking-wider mt-1">Moderate Risk</span>
            </div>
          </div>

          <!-- Key Indicators -->
          <div class="flex-1 w-full space-y-4">
            <h3 class="font-semibold text-gray-700 border-b pb-2">Key Health Indicators</h3>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-red-50 rounded-lg text-red-500">
                  <mat-icon>favorite</mat-icon>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Blood Pressure</p>
                  <p class="font-bold text-gray-800">{{ data?.bp || '120/80' }} mmHg</p>
                </div>
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Normal</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 rounded-lg text-blue-500">
                  <mat-icon>water_drop</mat-icon>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Cholesterol</p>
                  <p class="font-bold text-gray-800">185 mg/dL</p>
                </div>
              </div>
              <span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">Borderline</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-50 rounded-lg text-purple-500">
                  <mat-icon>monitor_heart</mat-icon>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Heart Rate</p>
                  <p class="font-bold text-gray-800">{{ data?.hr || '72' }} bpm</p>
                </div>
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Normal</span>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <mat-icon class="text-blue-600">medical_services</mat-icon>
            AI Recommendations
          </h3>
          <ul class="space-y-3">
            <li class="flex gap-3 text-sm text-gray-600">
              <mat-icon class="text-green-500 text-base mt-0.5">check_circle</mat-icon>
              <span>Maintain current physical activity levels (150 mins/week).</span>
            </li>
            <li class="flex gap-3 text-sm text-gray-600">
              <mat-icon class="text-green-500 text-base mt-0.5">check_circle</mat-icon>
              <span>Schedule a follow-up lipid profile in 3 months.</span>
            </li>
            <li class="flex gap-3 text-sm text-gray-600">
              <mat-icon class="text-green-500 text-base mt-0.5">check_circle</mat-icon>
              <span>Consider reducing sodium intake to manage blood pressure.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class RiskReportComponent {
  @Input() data: any;
  today = new Date();
}
