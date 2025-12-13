import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-patient-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="h-full p-6 overflow-y-auto bg-gray-50/50">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Patient Data Management</h2>
            <p class="text-gray-500">Enter patient details for risk assessment</p>
          </div>
          <button mat-stroked-button color="primary" class="bg-white">
            <mat-icon class="mr-2">upload_file</mat-icon>
            Import Data
          </button>
        </div>

        <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Information -->
          <mat-card class="col-span-full md:col-span-2 p-4 shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <mat-icon class="text-blue-500">person</mat-icon>
              Personal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" placeholder="John Doe" />
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Age</mat-label>
                <input matInput type="number" formControlName="age" placeholder="45" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="male">Male</mat-option>
                  <mat-option value="female">Female</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card>

          <!-- Vital Signs -->
          <mat-card class="p-4 shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <mat-icon class="text-red-500">favorite</mat-icon>
              Vital Signs
            </h3>
            <div class="space-y-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Blood Pressure (mmHg)</mat-label>
                <input matInput formControlName="bp" placeholder="120/80" />
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Heart Rate (bpm)</mat-label>
                <input matInput type="number" formControlName="hr" placeholder="72" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Oxygen Saturation (%)</mat-label>
                <input matInput type="number" formControlName="spo2" placeholder="98" />
              </mat-form-field>
            </div>
          </mat-card>

          <!-- Medical History -->
          <mat-card class="p-4 shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <mat-icon class="text-purple-500">history</mat-icon>
              Medical History
            </h3>
            <div class="space-y-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Conditions</mat-label>
                <mat-select formControlName="conditions" multiple>
                  <mat-option value="diabetes">Diabetes</mat-option>
                  <mat-option value="hypertension">Hypertension</mat-option>
                  <mat-option value="asthma">Asthma</mat-option>
                  <mat-option value="heart_disease">Heart Disease</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Allergies</mat-label>
                <input matInput formControlName="allergies" placeholder="Penicillin, Peanuts..." />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Current Medications</mat-label>
                <textarea matInput formControlName="medications" rows="2" placeholder="List current medications..."></textarea>
              </mat-form-field>
            </div>
          </mat-card>

          <div class="col-span-full flex justify-end mt-4">
            <button mat-raised-button color="primary" class="px-8 py-2 !h-12 text-lg" (click)="onAnalyze()">
              <mat-icon class="mr-2">analytics</mat-icon>
              Analyze Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PatientFormComponent {
  @Output() analyze = new EventEmitter<any>();

  form = this.fb.group({
    name: ['', Validators.required],
    age: ['', Validators.required],
    gender: ['', Validators.required],
    bp: ['', Validators.required],
    hr: ['', Validators.required],
    spo2: ['', Validators.required],
    conditions: [[]],
    allergies: [''],
    medications: ['']
  });

  constructor(private fb: FormBuilder) {}

  onAnalyze() {
    if (this.form.valid) {
      this.analyze.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
