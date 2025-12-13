import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { catchError, finalize, throwError, timeout } from "rxjs";
import { environment } from "../../../../../environments/environment";

const PATIENT_FIELD_KEYS = [
  "edad",
  "imc",
  "tipo_histologico",
  "valor_de_ca125",
  "metasta_distan",
  "ciclos_tto_NAdj",
  "asa",
  "afectacion_linf",
  "n_gangP_afec",
  "recep_est_porcent",
  "beta_cateninap",
  "FIGO2023",
  "estadificacion_",
  "Tributaria_a_Radioterapia",
  "est_pcte",
  "numero_de_recid",
  "tto_recidiva",
  "Reseccion_macroscopica_complet",
  "Grado",
  "ecotv_infiltsub",
  "ecotv_infiltobj",
  "estadiaje_pre_i",
  "tto_1_quirugico",
  "tamano_tumoral",
  "AP_centinela_pelvico",
  "AP_glanPaor",
  "rece_de_Ppor",
  "estudio_genetico",
  "Tratamiento_RT",
  "Tratamiento_sistemico",
  "libre_enferm",
  "causa_muerte",
] as const;

type PatientFieldKey = (typeof PATIENT_FIELD_KEYS)[number];

type PatientBackendPayload = Record<PatientFieldKey, number | null>;

type ProcesarDatosRequest = Record<PatientFieldKey, number>;

type ProcesarDatosResponse = {
  prediccionClase: number;
  prob1: number;
  prob2: number;
  prob3: number;
  prob4: number;
  prob5: number;
};

type FieldKind = "number" | "select";

type SelectOption = {
  value: number;
  label: string;
};

type FieldDef = {
  key: PatientFieldKey;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultValue?: number | null;
  options?: ReadonlyArray<SelectOption>;
};

type FieldGroup = {
  title: string;
  icon: string;
  fields: ReadonlyArray<FieldDef>;
};

const YES_NO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Sí" },
];

const TIPO_HISTOLOGICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Hiperplasia con atípias" },
  { value: 2, label: "Carcinoma endometroide" },
  { value: 3, label: "Carcinoma seroso" },
  { value: 4, label: "Carcinoma de células claras" },
  { value: 5, label: "Carcinoma indiferenciado" },
  { value: 6, label: "Carcinoma mixto" },
  { value: 7, label: "Carcinoma escamoso" },
  { value: 8, label: "Carcinosarcoma" },
  { value: 9, label: "Leiomiosarcoma" },
  { value: 10, label: "Sarcoma de estroma endometrial" },
  { value: 11, label: "Sarcoma indiferenciado" },
  { value: 12, label: "Adenosarcoma" },
  { value: 88, label: "Otros" },
];

const ASA_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "ASA 1" },
  { value: 1, label: "ASA 2" },
  { value: 2, label: "ASA 3" },
  { value: 3, label: "ASA 4" },
  { value: 4, label: "ASA 5" },
  { value: 5, label: "ASA 6" },
  { value: 6, label: "Desconocido" },
];

const BETA_CATENINA_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Sí" },
  { value: 2, label: "No realizado" },
];

const FIGO_2023_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "IA1" },
  { value: 2, label: "IA2" },
  { value: 3, label: "IA3" },
  { value: 4, label: "IB" },
  { value: 5, label: "IC" },
  { value: 6, label: "IIA" },
  { value: 7, label: "IIB" },
  { value: 8, label: "IIC" },
  { value: 9, label: "IIIA" },
  { value: 10, label: "IIIB" },
  { value: 11, label: "IIIC" },
  { value: 12, label: "IVA" },
  { value: 13, label: "IVB" },
  { value: 14, label: "IVC" },
];

const FIGO_2018_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Ia" },
  { value: 2, label: "Ib" },
  { value: 3, label: "II" },
  { value: 4, label: "IIIa" },
  { value: 5, label: "IIIb" },
  { value: 6, label: "IIIc1" },
  { value: 7, label: "IIIc2" },
  { value: 8, label: "IVa" },
  { value: 9, label: "IVb" },
];

const EST_PCTE_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Viva" },
  { value: 2, label: "Muerta" },
  { value: 3, label: "Desconocido" },
];

const CAUSA_MUERTE_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Por el cáncer de endometrio" },
  { value: 1, label: "Otras causas" },
];

const LIBRE_ENFERM_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Sí" },
  { value: 2, label: "Desconocido" },
];

const TTO_RECIDIVA_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Curativo" },
  { value: 2, label: "Paliativo" },
];

const GRADO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Bajo grado (G1-G2)" },
  { value: 2, label: "Alto grado (G3)" },
];

const INFILTRACION_SUBJETIVO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "No aplicado" },
  { value: 2, label: "<50%" },
  { value: 3, label: ">50%" },
  { value: 4, label: "No valorable" },
];

const INFILTRACION_OBJETIVO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "No aplicado" },
  { value: 2, label: "<50%" },
  { value: 3, label: ">50%" },
  { value: 4, label: "No valorable" },
];

const ESTADIAJE_PRE_IQ_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Estadio I" },
  { value: 1, label: "Estadio II" },
  { value: 2, label: "Estadio III y IV" },
];

const AP_CENTINELA_PELVICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Negativo (pN0)" },
  { value: 1, label: "Células tumorales aisladas (pN0(i+))" },
  { value: 2, label: "Micrometástasis (pN1(mi))" },
  { value: 3, label: "Macrometástasis (pN1)" },
  { value: 4, label: "pNx" },
];

const AP_GANGLIOS_PARAORTICOS_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Negativo" },
  { value: 1, label: "Células tumorales aisladas" },
  { value: 2, label: "Micrometástasis" },
  { value: 3, label: "Macrometástasis" },
];

const ESTUDIO_GENETICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Negativo" },
  { value: 2, label: "BRCA1" },
  { value: 3, label: "BRCA2" },
  { value: 4, label: "Lynch" },
  { value: 5, label: "Otros" },
  { value: 6, label: "No realizado" },
];

const FIELD_GROUPS: ReadonlyArray<FieldGroup> = [
  {
    title: "Paciente",
    icon: "person",
    fields: [
      { key: "edad", label: "Edad", kind: "number", required: true, placeholder: "68" },
      { key: "imc", label: "IMC", kind: "number", required: true, placeholder: "39.4" },
      { key: "asa", label: "ASA", kind: "select", required: true, options: ASA_OPTIONS },
    ],
  },
  {
    title: "Tumor y AP",
    icon: "biotech",
    fields: [
      { key: "tipo_histologico", label: "Tipo histológico", kind: "select", required: true, options: TIPO_HISTOLOGICO_OPTIONS },
      { key: "Grado", label: "Grado", kind: "select", required: true, options: GRADO_OPTIONS },
      { key: "tamano_tumoral", label: "Tamaño tumoral (cm)", kind: "number", placeholder: "3.7" },
      { key: "valor_de_ca125", label: "CA-125 (prequirúrgico inicial)", kind: "number", placeholder: "283" },
      { key: "metasta_distan", label: "Metástasis a distancia", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "afectacion_linf", label: "Afectación linfovascular", kind: "select", required: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Estadiaje",
    icon: "timeline",
    fields: [
      { key: "FIGO2023", label: "FIGO 2023 (quirúrgico)", kind: "select", required: true, options: FIGO_2023_OPTIONS },
      { key: "estadificacion_", label: "FIGO 2018 (quirúrgico)", kind: "select", required: true, options: FIGO_2018_OPTIONS },
      { key: "estadiaje_pre_i", label: "Estadiaje pre-IQ", kind: "select", required: true, options: ESTADIAJE_PRE_IQ_OPTIONS },
      { key: "ecotv_infiltsub", label: "Infiltración miometrial (subjetivo)", kind: "select", required: true, options: INFILTRACION_SUBJETIVO_OPTIONS },
      { key: "ecotv_infiltobj", label: "Infiltración miometrial (objetivo, Karlsson)", kind: "select", required: true, options: INFILTRACION_OBJETIVO_OPTIONS },
    ],
  },
  {
    title: "Ganglios",
    icon: "hub",
    fields: [
      { key: "AP_centinela_pelvico", label: "AP centinela pélvico", kind: "select", required: true, options: AP_CENTINELA_PELVICO_OPTIONS },
      { key: "n_gangP_afec", label: "Nº ganglios pélvicos afectados", kind: "number", placeholder: "5" },
      { key: "AP_glanPaor", label: "AP ganglios paraórticos", kind: "select", required: true, options: AP_GANGLIOS_PARAORTICOS_OPTIONS },
    ],
  },
  {
    title: "Biomarcadores",
    icon: "science",
    fields: [
      { key: "recep_est_porcent", label: "Receptores de estrógenos (%)", kind: "number", placeholder: "80", hint: "0-100" },
      { key: "rece_de_Ppor", label: "Receptores de progesterona (%)", kind: "number", placeholder: "10", hint: "0-100" },
      { key: "beta_cateninap", label: "Beta catenina (positividad nuclear)", kind: "select", required: true, options: BETA_CATENINA_OPTIONS },
      { key: "estudio_genetico", label: "Estudio genético", kind: "select", required: true, options: ESTUDIO_GENETICO_OPTIONS },
    ],
  },
  {
    title: "Tratamiento",
    icon: "medical_services",
    fields: [
      { key: "tto_1_quirugico", label: "Tratamiento 1º quirúrgico", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "ciclos_tto_NAdj", label: "Nº ciclos de tto neo-adyuvante", kind: "number", placeholder: "6" },
      { key: "Tributaria_a_Radioterapia", label: "¿Tributaria a radioterapia?", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "Tratamiento_RT", label: "Tratamiento RT", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "Tratamiento_sistemico", label: "Tratamiento sistémico", kind: "select", required: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Recidiva y evolución",
    icon: "history",
    fields: [
      { key: "numero_de_recid", label: "Número de recidiva", kind: "number", placeholder: "1" },
      { key: "tto_recidiva", label: "Tratamiento de la recidiva", kind: "select", required: true, options: TTO_RECIDIVA_OPTIONS },
      { key: "Reseccion_macroscopica_complet", label: "Resección macroscópica completa", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "est_pcte", label: "Estado actual de la paciente", kind: "select", required: true, options: EST_PCTE_OPTIONS },
      { key: "libre_enferm", label: "Libre de enfermedad", kind: "select", required: true, options: LIBRE_ENFERM_OPTIONS, defaultValue: 2 },
      { key: "causa_muerte", label: "Causa de muerte", kind: "select", required: true, options: CAUSA_MUERTE_OPTIONS, defaultValue: 2 },
    ],
  },
];

const ALL_FIELDS: ReadonlyArray<FieldDef> = FIELD_GROUPS.flatMap((g) => g.fields);

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
    MatSelectModule,
  ],
  templateUrl: "./patient-form.component.html",
})
export class PatientFormComponent {
  @Output() analyze = new EventEmitter<{ request: ProcesarDatosRequest; response: ProcesarDatosResponse }>();

  readonly fieldGroups = FIELD_GROUPS;
  jsonInput = "";
  jsonParseError: string | null = null;
  submitError: string | null = null;
  isSubmitting = false;
  lastResponse: ProcesarDatosResponse | null = null;

  form = this.fb.group(
    Object.fromEntries(
      ALL_FIELDS.map(({ key, required, defaultValue }) => [
        key,
        required ? [defaultValue ?? null, Validators.required] : [defaultValue ?? null],
      ]),
    ) as Record<PatientFieldKey, any>,
  );

  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, "");
  private readonly defaultFormValues = Object.fromEntries(
    ALL_FIELDS.map(({ key, defaultValue }) => [key, defaultValue ?? null]),
  ) as Record<PatientFieldKey, number | null>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
  ) {}

  clearForm(): void {
    this.form.reset(this.defaultFormValues);
    this.jsonParseError = null;
    this.submitError = null;
    this.lastResponse = null;
  }

  onJsonTextChanged(next: string): void {
    this.jsonInput = next ?? "";
    this.jsonParseError = null;
    this.submitError = null;
  }

  async onJsonFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      this.jsonInput = await file.text();
      this.jsonParseError = null;
      this.submitError = null;
      this.applyJsonInput();
    } catch {
      this.jsonParseError = "No se pudo leer el archivo.";
    } finally {
      if (input) input.value = "";
    }
  }

  applyJsonInput(): void {
    this.jsonParseError = null;
    this.submitError = null;
    const raw = this.jsonInput.trim();
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.jsonParseError = "JSON inválido.";
      return;
    }

    const obj = this.extractCandidateObject(parsed);
    if (!obj) {
      this.jsonParseError = "Formato JSON no reconocido.";
      return;
    }

    const patch: Partial<PatientBackendPayload> = {};
    for (const { key } of ALL_FIELDS) {
      if (key === "estudio_genetico" && !Object.prototype.hasOwnProperty.call(obj, key)) {
        const inferred = this.inferEstudioGeneticoFromLegacyFlags(obj);
        if (inferred !== null) patch[key] = inferred;
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      patch[key] = this.coerceNumber((obj as any)[key]);
    }

    this.form.patchValue(patch, { emitEvent: false });
  }

  private extractCandidateObject(parsed: unknown): Record<string, unknown> | null {
    if (!parsed) return null;
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
    }
    if (typeof parsed !== "object") return null;

    const obj = parsed as Record<string, unknown>;
    const commonWrappers = ["data", "payload", "input", "features", "paciente", "patient"];
    for (const w of commonWrappers) {
      const inner = obj[w];
      if (!inner) continue;
      if (Array.isArray(inner)) {
        const first = inner[0];
        if (first && typeof first === "object") return first as Record<string, unknown>;
        continue;
      }
      if (typeof inner === "object") return inner as Record<string, unknown>;
    }
    return obj;
  }

  private coerceNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return this.coerceNumber(value[0]);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toUpperCase() === "NA") return null;
      const normalized = trimmed.replace(",", ".");
      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, "0")) return this.coerceNumber(obj["0"]);
      const firstKey = Object.keys(obj)[0];
      return firstKey ? this.coerceNumber(obj[firstKey]) : null;
    }
    return null;
  }

  private inferEstudioGeneticoFromLegacyFlags(obj: Record<string, unknown>): number | null {
    const mapping: ReadonlyArray<{ key: string; code: number }> = [
      { key: "estudio_genetico_r01", code: 1 },
      { key: "estudio_genetico_r02", code: 2 },
      { key: "estudio_genetico_r03", code: 3 },
      { key: "estudio_genetico_r04", code: 4 },
      { key: "estudio_genetico_r05", code: 5 },
      { key: "estudio_genetico_r06", code: 6 },
    ];

    for (const { key, code } of mapping) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const v = this.coerceNumber(obj[key]);
      if (v === null) continue;
      if (v === 1 || v === code) return code;
    }
    return null;
  }

  private buildRequestPayload(): ProcesarDatosRequest {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const payload: Partial<ProcesarDatosRequest> = {};
    for (const key of PATIENT_FIELD_KEYS) {
      const coerced = this.coerceNumber(raw[key]);
      payload[key] = coerced ?? 0;
    }
    return payload as ProcesarDatosRequest;
  }

  submitToBackend(): void {
    this.jsonParseError = null;
    this.submitError = null;
    this.lastResponse = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildRequestPayload();
    this.isSubmitting = true;

    this.http
      .post<ProcesarDatosResponse>(`${this.apiBaseUrl}/procesarDatos`, request)
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        catchError((err) => throwError(() => this.humanizeSubmitError(err))),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (resp) => {
          this.lastResponse = resp;
          this.analyze.emit({ request, response: resp });
        },
        error: (err: Error) => {
          this.submitError = err.message;
        },
      });
  }

  private humanizeSubmitError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const maybeDetail = (err.error && typeof err.error === "object" ? (err.error as any).detail : null) as unknown;
      if (typeof maybeDetail === "string" && maybeDetail.trim()) return new Error(maybeDetail.trim());
      if (Array.isArray(maybeDetail)) return new Error("Datos inválidos (422). Revisa los campos.");
      if (err.status === 401) return new Error("No autorizado. Inicia sesión de nuevo.");
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error("No se pudo conectar con el backend.");
    }
    if (err instanceof Error) return err;
    return new Error("Error inesperado.");
  }
}
