import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

type ProcesarDatosResponse = {
  prediccionClase: number;
  prob1: number;
  prob2: number;
  prob3: number;
  prob4: number;
  prob5: number;
};

@Component({
  selector: "app-risk-report",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden h-full flex flex-col">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start shrink-0">
        <div>
          <h2 class="text-2xl font-bold m-0">Resultado del modelo</h2>
          <p class="text-blue-100 mt-1">Generado el {{ today | date:'medium' }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8 overflow-y-auto flex-1">
        <ng-container *ngIf="result; else noResult">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <mat-icon class="text-blue-600">verified</mat-icon>
                Predicción
              </h3>

              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl" [ngClass]="riskBadgeClass(result.prediccionClase)">
                  {{ result.prediccionClase }}
                </div>
                <div>
                  <div class="text-lg font-bold text-gray-800">{{ riskLabel(result.prediccionClase) }}</div>
                  <div class="text-sm text-gray-500">Confianza: {{ formatPct(predictedProbability) }}</div>
                </div>
              </div>

              <div class="mt-6">
                <div class="text-xs uppercase tracking-wider text-gray-500 mb-2">Distribución</div>
                <div class="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full" [ngClass]="riskBarClass(result.prediccionClase)" [style.width.%]="(predictedProbability || 0) * 100"></div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100">
              <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <mat-icon class="text-indigo-600">analytics</mat-icon>
                Probabilidades por clase
              </h3>

              <div class="space-y-4">
                <div *ngFor="let p of probs; let idx = index" class="flex items-center gap-4">
                  <div class="w-28 text-sm font-medium text-gray-700">
                    {{ idx + 1 }} · {{ riskLabel(idx + 1) }}
                  </div>
                  <div class="flex-1">
                    <div class="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div class="h-full rounded-full" [ngClass]="riskBarClass(idx + 1)" [style.width.%]="p * 100"></div>
                    </div>
                  </div>
                  <div class="w-16 text-right text-sm font-mono text-gray-600">{{ formatPct(p) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div class="flex items-start gap-3">
              <mat-icon class="text-blue-600 mt-0.5">info</mat-icon>
              <div class="text-sm text-blue-900">
                Usa el chatbot de la derecha para preguntar por el tratamiento adyuvante sugerido según la tabla VII.
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #noResult>
          <div class="bg-gray-50 rounded-xl p-6 border border-gray-100 text-gray-700">
            <div class="flex items-start gap-3">
              <mat-icon class="text-gray-500 mt-0.5">warning</mat-icon>
              <div>
                <div class="font-semibold">No hay resultados disponibles</div>
                <div class="text-sm text-gray-500 mt-1">Vuelve a la página de datos y procesa un caso para ver el reporte.</div>
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class RiskReportComponent {
  @Input() data: any;
  today = new Date();

  get result(): ProcesarDatosResponse | null {
    const r = (this.data && typeof this.data === "object" ? (this.data as any).response : null) as unknown;
    if (!r || typeof r !== "object") return null;
    const pred = (r as any).prediccionClase;
    if (typeof pred !== "number") return null;
    const probs = [ (r as any).prob1, (r as any).prob2, (r as any).prob3, (r as any).prob4, (r as any).prob5 ];
    if (probs.some((p) => typeof p !== "number")) return null;
    return r as ProcesarDatosResponse;
  }

  get probs(): number[] {
    if (!this.result) return [];
    return [
      this.normalizeProbability(this.result.prob1),
      this.normalizeProbability(this.result.prob2),
      this.normalizeProbability(this.result.prob3),
      this.normalizeProbability(this.result.prob4),
      this.normalizeProbability(this.result.prob5),
    ];
  }

  get predictedProbability(): number | null {
    if (!this.result) return null;
    const idx = Math.round(this.result.prediccionClase) - 1;
    const probs = this.probs;
    if (idx < 0 || idx >= probs.length) return null;
    return probs[idx];
  }

  riskLabel(cls: number): string {
    switch (cls) {
      case 1:
        return "Riesgo bajo";
      case 2:
        return "Riesgo intermedio";
      case 3:
        return "Riesgo intermedio-alto";
      case 4:
        return "Riesgo alto";
      case 5:
        return "Avanzado";
      default:
        return `Clase ${cls}`;
    }
  }

  riskBadgeClass(cls: number): string {
    switch (cls) {
      case 1:
        return "bg-green-600";
      case 2:
        return "bg-yellow-600";
      case 3:
        return "bg-orange-600";
      case 4:
        return "bg-red-600";
      case 5:
        return "bg-purple-700";
      default:
        return "bg-gray-600";
    }
  }

  riskBarClass(cls: number): string {
    switch (cls) {
      case 1:
        return "bg-green-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-orange-500";
      case 4:
        return "bg-red-500";
      case 5:
        return "bg-purple-600";
      default:
        return "bg-gray-500";
    }
  }

  formatPct(prob: number | null): string {
    if (prob === null || !Number.isFinite(prob)) return "—";
    const pct = prob * 100;
    if (pct === 0) return "0%";
    if (pct < 0.01) return "<0.01%";
    if (pct < 1) return `${pct.toFixed(2)}%`;
    if (pct < 10) return `${pct.toFixed(1)}%`;
    return `${Math.round(pct)}%`;
  }

  private normalizeProbability(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 1 && value <= 100) return value / 100;
    if (value > 1) return 1;
    return value;
  }
}
