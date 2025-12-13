import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AnalysisService } from '../../core/analysis/analysis.service';
import { PatientFormComponent } from '../dashboard/components/patient-form/patient-form.component';

@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [PatientFormComponent],
  template: `
    <div class="h-full overflow-y-auto p-8 bg-gray-50">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Análisis de Riesgo</h1>
          <p class="text-gray-600">Complete los datos del paciente para generar un reporte de riesgo cardiovascular.</p>
        </div>
        
        <app-patient-form (analyze)="onAnalyze($event)"></app-patient-form>
      </div>
    </div>
  `
})
export class AnalyzeComponent {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly router: Router
  ) {}

  onAnalyze(data: any): void {
    this.analysisService.setAnalysisData(data);
    this.router.navigate(['/results']);
  }
}
