import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PatientFormComponent } from '../patient-form/patient-form.component';
import { DataService } from 'src/app/core/data/data.service';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [PatientFormComponent],
  template: `
    <div class="h-full overflow-y-auto p-8 bg-gray-50">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Predicció de Risc</h1>
          <p class="text-gray-600">Completa les dades del pacient per generar un informe de risc cardiovascular.</p>
        </div>
        
        <app-patient-form (dataSubmit)="onDataSubmit($event)"></app-patient-form>
      </div>
    </div>
  `
})
export class DataComponent {
  constructor(
    private readonly dataService: DataService,
    private readonly router: Router
  ) {}

  onDataSubmit(data: any): void {
    this.dataService.setData(data);
    this.router.navigate(['/results']);
  }
}
