import { CommonModule } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { catchError, finalize, throwError, timeout } from "rxjs";
import { environment } from "../../../../../environments/environment";

type ChatRole = "user" | "assistant";

type ApiMessage = {
  role: ChatRole;
  content: string;
};

type ChatBotRequest = {
  historial: ApiMessage[];
};

type ChatBotResponse = {
  respuesta?: string;
  error?: string;
};

type ChatMessage = {
  role: ChatRole;
  content: string;
  time: string;
  kind: "intro" | "chat";
};

@Component({
  selector: "app-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule],
  template: `
    <div class="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm">
      <div class="p-4 border-b border-gray-200 bg-blue-50">
        <div class="flex items-center gap-2">
          <mat-icon class="text-blue-600">smart_toy</mat-icon>
          <h3 class="font-semibold text-gray-800 m-0">Asistente</h3>
        </div>
        <p class="text-xs text-gray-500 mt-1">Pregúntame sobre el riesgo y el tratamiento adyuvante.</p>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div *ngFor="let msg of messages" class="flex flex-col" [ngClass]="{'items-end': msg.role === 'user', 'items-start': msg.role !== 'user'}">
          <div 
            class="max-w-[85%] p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap"
            [ngClass]="{
              'bg-blue-600 text-white rounded-br-none': msg.role === 'user',
              'bg-white text-gray-800 border border-gray-200 rounded-bl-none': msg.role !== 'user'
            }"
          >
            {{ msg.content }}
          </div>
          <span class="text-[10px] text-gray-400 mt-1 px-1">{{ msg.time }}</span>
        </div>
      </div>

      <div class="p-4 bg-white border-t border-gray-200">
        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            (keyup.enter)="sendMessage()"
            [disabled]="isSending"
            placeholder="Escribe tu pregunta..." 
            class="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <button 
            (click)="sendMessage()" 
            [disabled]="!newMessage.trim() || isSending"
            class="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <mat-icon class="text-sm w-4 h-4 flex items-center justify-center">{{ isSending ? 'hourglass_top' : 'send' }}</mat-icon>
          </button>
        </div>
        <div *ngIf="error" class="text-xs text-red-600 mt-2 px-2">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    /* Override Material Icon size for the small send button */
    button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ChatbotComponent implements OnInit {
  @Input() data: any;

  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, "");

  messages: ChatMessage[] = [];
  private readonly apiHistory: ApiMessage[] = [];

  private dataContextForFirstPrompt: string | null = null;
  private hasInjectedDataContext = false;

  newMessage = "";
  isSending = false;
  error: string | null = null;

  constructor(private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.refreshDataContext();
    this.ensureIntroMessage();
  }

  ngOnChanges(): void {
    this.refreshDataContext();
    this.ensureIntroMessage();
  }

  private nowTime(): string {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private ensureIntroMessage(): void {
    const introContent = this.buildIntroMessage();
    const first = this.messages[0];
    if (!first) {
      this.messages.unshift({ role: "assistant", content: introContent, time: this.nowTime(), kind: "intro" });
      return;
    }
    if (first.kind === "intro") {
      first.content = introContent;
    }
  }

  private buildIntroMessage(): string {
    const r = this.getProcesarDatosResponse();
    if (!r) return "Hola, soy tu asistente clínico. Si ya tienes una clase de riesgo, dime cuál y te indicaré el tratamiento adyuvante según la tabla VII.";

    const cls = r.prediccionClase;
    const probs = [r.prob1, r.prob2, r.prob3, r.prob4, r.prob5].map((p) => this.normalizeProbability(p));
    const conf = probs[Math.max(0, Math.min(4, cls - 1))] ?? null;

    return [
      `Resultado de /procesarDatos:`,
      `- Clase: ${cls} (${this.riskLabel(cls)})`,
      `- Confianza: ${this.formatPct(conf)}`,
      ``,
      `Pregunta lo que necesites (tratamiento adyuvante, dudas, efectos, etc.).`,
    ].join("\n");
  }

  private refreshDataContext(): void {
    const r = this.getProcesarDatosResponse();
    if (!r) {
      this.dataContextForFirstPrompt = null;
      this.hasInjectedDataContext = false;
      return;
    }

    const cls = r.prediccionClase;
    const probs = [r.prob1, r.prob2, r.prob3, r.prob4, r.prob5].map((p) => this.normalizeProbability(p));
    const conf = probs[Math.max(0, Math.min(4, cls - 1))] ?? null;

    this.dataContextForFirstPrompt = [
      `Contexto del caso: el endpoint /procesarDatos ha devuelto clase ${cls} (${this.riskLabel(cls)}).`,
      `Probabilidades: [${probs.map((p) => this.formatPct(p)).join(", ")}].`,
      `Confianza clase predicha: ${this.formatPct(conf)}.`,
      `Clasificación molecular: desconocida (si no se especifica).`,
    ].join(" ");
  }

  private getProcesarDatosResponse(): { prediccionClase: number; prob1: number; prob2: number; prob3: number; prob4: number; prob5: number } | null {
    const resp = this.data && typeof this.data === "object" ? (this.data as any).response : null;
    if (!resp || typeof resp !== "object") return null;
    if (typeof (resp as any).prediccionClase !== "number") return null;
    const probs = [(resp as any).prob1, (resp as any).prob2, (resp as any).prob3, (resp as any).prob4, (resp as any).prob5];
    if (probs.some((p) => typeof p !== "number")) return null;
    return resp as any;
  }

  private riskLabel(cls: number): string {
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

  private formatPct(prob: number | null): string {
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

  sendMessage() {
    const raw = this.newMessage.trim();
    if (!raw || this.isSending) return;

    this.error = null;
    this.messages.push({ role: "user", content: raw, time: this.nowTime(), kind: "chat" });
    this.newMessage = "";

    let contentForApi = raw;
    if (!this.hasInjectedDataContext && this.dataContextForFirstPrompt) {
      contentForApi = `${this.dataContextForFirstPrompt}\n\nPregunta del usuario: ${raw}`;
      this.hasInjectedDataContext = true;
    }

    this.apiHistory.push({ role: "user", content: contentForApi });
    const payload: ChatBotRequest = { historial: [...this.apiHistory] };

    this.isSending = true;
    this.http
      .post<ChatBotResponse>(`${this.apiBaseUrl}/chatBot`, payload)
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        catchError((err) => throwError(() => this.humanizeError(err))),
        finalize(() => {
          this.isSending = false;
        }),
      )
      .subscribe({
        next: (resp) => {
          const answer = typeof resp.respuesta === "string" && resp.respuesta.trim()
            ? resp.respuesta.trim()
            : typeof resp.error === "string" && resp.error.trim()
              ? resp.error.trim()
              : "Respuesta vacía del backend.";
          this.messages.push({ role: "assistant", content: answer, time: this.nowTime(), kind: "chat" });
          this.apiHistory.push({ role: "assistant", content: answer });
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.error = err.message;
          const answer = `No se pudo obtener respuesta del chatbot: ${err.message}`;
          this.messages.push({ role: "assistant", content: answer, time: this.nowTime(), kind: "chat" });
          this.apiHistory.push({ role: "assistant", content: answer });
          this.cdr.markForCheck();
        },
      });
  }

  private humanizeError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const maybeDetail = (err.error && typeof err.error === "object" ? (err.error as any).detail : null) as unknown;
      if (typeof maybeDetail === "string" && maybeDetail.trim()) return new Error(maybeDetail.trim());
      if (Array.isArray(maybeDetail)) return new Error("Datos inválidos (422).");
      if (err.status === 401) return new Error("No autorizado. Inicia sesión de nuevo.");
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error("No se pudo conectar con el backend.");
    }
    if (err instanceof Error) return err;
    return new Error("Error inesperado.");
  }
}
