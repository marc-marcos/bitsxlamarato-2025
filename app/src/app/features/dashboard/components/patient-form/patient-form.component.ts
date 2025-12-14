import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Subscription, catchError, finalize, throwError, timeout } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { DataService } from "src/app/core/data/data.service";

const NUMERIC_PATIENT_FIELD_KEYS = [
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

const DATE_PATIENT_FIELD_KEYS = [
  "fecha_de_recidi",
  "fecha_qx",
  "visita_control",
  "f_muerte",
] as const;

const PATIENT_FIELD_KEYS = [...NUMERIC_PATIENT_FIELD_KEYS, ...DATE_PATIENT_FIELD_KEYS] as const;

type PatientFieldKey = (typeof PATIENT_FIELD_KEYS)[number];

const TRAINING_FIELD_KEYS = [...PATIENT_FIELD_KEYS, "grupo_de_riesgo_definitivo"] as const;

type TrainingFieldKey = (typeof TRAINING_FIELD_KEYS)[number];

type PatientBackendPayload = Record<TrainingFieldKey, number | string | null>;

type ProcesarDatosRequest = Record<PatientFieldKey, number | string>;

type ProcesarDatosResponse = {
  prediccionClase: number;
  prob1: number;
  prob2: number;
  prob3: number;
  prob4: number;
  prob5: number;
};

type NuevaMuestraRequest = Record<TrainingFieldKey, number | string>;

type NuevaMuestraResponse = {
  status?: string;
  message?: string;
  mensaje?: string;
};

type FieldKind = "number" | "select" | "date";

type SelectOption = {
  value: number;
  label: string;
};

type FieldDef = {
  key: TrainingFieldKey;
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
  onlyWhenTraining?: boolean;
};

const YES_NO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Sí" },
];

const TIPO_HISTOLOGICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Hiperplàsia amb atípies" },
  { value: 2, label: "Carcinoma endometroide" },
  { value: 3, label: "Carcinoma serós" },
  { value: 4, label: "Carcinoma de cèl·lules clares" },
  { value: 5, label: "Carcinoma indiferenciat" },
  { value: 6, label: "Carcinoma mixt" },
  { value: 7, label: "Carcinoma escamós" },
  { value: 8, label: "Carcinosarcoma" },
  { value: 9, label: "Leiomiosarcoma" },
  { value: 10, label: "Sarcoma d'estroma endometrial" },
  { value: 11, label: "Sarcoma indiferenciat" },
  { value: 12, label: "Adenosarcoma" },
  { value: 88, label: "Altres" },
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
  { value: 2, label: "No realitzat" },
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
  { value: 2, label: "Morta" },
  { value: 3, label: "Desconegut" },
];

const CAUSA_MUERTE_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Pel càncer d'endometri" },
  { value: 1, label: "Altres causes" },
];

const LIBRE_ENFERM_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Sí" },
  { value: 2, label: "Desconegut" },
];

const GRUPO_RIESGO_DEFINITIVO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Risc baix" },
  { value: 2, label: "Risc intermig" },
  { value: 3, label: "Risc intermig-alt" },
  { value: 4, label: "Risc alt" },
  { value: 5, label: "Avançats" },
];

const TTO_RECIDIVA_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "No" },
  { value: 1, label: "Curativa" },
  { value: 2, label: "Paliativa" },
];

const GRADO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Baix grau (G1-G2)" },
  { value: 2, label: "Alt grau (G3)" },
];

const INFILTRACION_SUBJETIVO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "No aplicat" },
  { value: 2, label: "<50%" },
  { value: 3, label: ">50%" },
  { value: 4, label: "No valorable" },
];

const INFILTRACION_OBJETIVO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "No aplicat" },
  { value: 2, label: "<50%" },
  { value: 3, label: ">50%" },
  { value: 4, label: "No valorable" },
];

const ESTADIAJE_PRE_IQ_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Estadi I" },
  { value: 1, label: "Estadi II" },
  { value: 2, label: "Estadi III i IV" },
];

const AP_CENTINELA_PELVICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Negatiu (pN0)" },
  { value: 1, label: "Cèl·lules tumorals aïllades (pN0(i+))" },
  { value: 2, label: "Micrometàstasis (pN1(mi))" },
  { value: 3, label: "Macrometàstasis (pN1)" },
  { value: 4, label: "pNx" },
];

const AP_GANGLIOS_PARAORTICOS_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 0, label: "Negatiu" },
  { value: 1, label: "Cèl·lules tumorals aïllades" },
  { value: 2, label: "Micrometàstasis" },
  { value: 3, label: "Macrometàstasis" },
];

const ESTUDIO_GENETICO_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: 1, label: "Negatiu" },
  { value: 2, label: "BRCA1" },
  { value: 3, label: "BRCA2" },
  { value: 4, label: "Lynch" },
  { value: 5, label: "Altres" },
  { value: 6, label: "No realitzat" },
];

const FIELD_GROUPS: ReadonlyArray<FieldGroup> = [
  {
    title: "Pacient",
    icon: "person",
    fields: [
      { key: "edad", label: "Edat", kind: "number", required: true, placeholder: "68" },
      { key: "imc", label: "IMC", kind: "number", required: true, placeholder: "39.4" },
      { key: "asa", label: "ASA", kind: "select", required: true, options: ASA_OPTIONS },
    ],
  },
  {
    title: "Tumor i AP",
    icon: "biotech",
    fields: [
      { key: "tipo_histologico", label: "Tipus histològic", kind: "select", required: true, options: TIPO_HISTOLOGICO_OPTIONS },
      { key: "Grado", label: "Grau", kind: "select", required: true, options: GRADO_OPTIONS },
      { key: "tamano_tumoral", label: "Mida tumoral (cm)", kind: "number", placeholder: "3.7" },
      { key: "valor_de_ca125", label: "CA-125 (preoperatori inicial)", kind: "number", placeholder: "283" },
      { key: "metasta_distan", label: "Metàstasis a distància", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "afectacion_linf", label: "Afectació linfovascular", kind: "select", required: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Estadiament",
    icon: "timeline",
    fields: [
      { key: "FIGO2023", label: "FIGO 2023 (quirúrgic)", kind: "select", required: true, options: FIGO_2023_OPTIONS },
      { key: "estadificacion_", label: "FIGO 2018 (quirúrgic)", kind: "select", required: true, options: FIGO_2018_OPTIONS },
      { key: "estadiaje_pre_i", label: "Estadiament pre-IQ", kind: "select", required: true, options: ESTADIAJE_PRE_IQ_OPTIONS },
      { key: "ecotv_infiltsub", label: "Infiltració miometrial (subjectiu)", kind: "select", required: true, options: INFILTRACION_SUBJETIVO_OPTIONS },
      { key: "ecotv_infiltobj", label: "Infiltració miometrial (objectiu, Karlsson)", kind: "select", required: true, options: INFILTRACION_OBJETIVO_OPTIONS },
    ],
  },
  {
    title: "Ganglis",
    icon: "hub",
    fields: [
      { key: "AP_centinela_pelvico", label: "AP centinella pèlvic", kind: "select", required: true, options: AP_CENTINELA_PELVICO_OPTIONS },
      { key: "n_gangP_afec", label: "Nº ganglis pèlvics afectats", kind: "number", placeholder: "5" },
      { key: "AP_glanPaor", label: "AP ganglis paraaòrtics", kind: "select", required: true, options: AP_GANGLIOS_PARAORTICOS_OPTIONS },
    ],
  },
  {
    title: "Biomarcadors",
    icon: "science",
    fields: [
      { key: "recep_est_porcent", label: "Receptors d'estrògen (%)", kind: "number", placeholder: "80", hint: "0-100" },
      { key: "rece_de_Ppor", label: "Receptors de progesterona (%)", kind: "number", placeholder: "10", hint: "0-100" },
      { key: "beta_cateninap", label: "Beta catenina (positivitat nuclear)", kind: "select", required: true, options: BETA_CATENINA_OPTIONS },
      { key: "estudio_genetico", label: "Estudi genètic", kind: "select", required: true, options: ESTUDIO_GENETICO_OPTIONS },
    ],
  },
  {
    title: "Tractament",
    icon: "medical_services",
    fields: [
      { key: "tto_1_quirugico", label: "Tractament 1º quirúrgic", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "ciclos_tto_NAdj", label: "Nº cicles de tractament neo-adyuvant", kind: "number", placeholder: "6" },
      { key: "Tributaria_a_Radioterapia", label: "¿Tributari a radioterapia?", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "Tratamiento_RT", label: "Tractament RT", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "Tratamiento_sistemico", label: "Tractament sistèmic", kind: "select", required: true, options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Dates",
    icon: "event",
    fields: [
      { key: "fecha_qx", label: "Data de cirurgia", kind: "date", required: true },
      { key: "visita_control", label: "Data de darrera visita", kind: "date", required: true },
      { key: "fecha_de_recidi", label: "Data de recidiva", kind: "date", required: true },
      { key: "f_muerte", label: "Data de mort", kind: "date", required: true },
    ],
  },
  {
    title: "Recidiva i evolució",
    icon: "history",
    fields: [
      { key: "numero_de_recid", label: "Número de recidiva", kind: "number", placeholder: "1" },
      { key: "tto_recidiva", label: "Tractament de la recidiva", kind: "select", required: true, options: TTO_RECIDIVA_OPTIONS },
      { key: "Reseccion_macroscopica_complet", label: "Resecció macroscòpica completa", kind: "select", required: true, options: YES_NO_OPTIONS },
      { key: "est_pcte", label: "Estat actual de la pacient", kind: "select", required: true, options: EST_PCTE_OPTIONS },
      { key: "libre_enferm", label: "Lliure de malaltia", kind: "select", required: true, options: LIBRE_ENFERM_OPTIONS, defaultValue: 2 },
      { key: "causa_muerte", label: "Causa de mort", kind: "select", required: true, options: CAUSA_MUERTE_OPTIONS, defaultValue: 2 },
    ],
  },
  {
    title: "Entrenament",
    icon: "school",
    onlyWhenTraining: true,
    fields: [
      { key: "grupo_de_riesgo_definitivo", label: "Grup de risc definitiu", kind: "select", required: true, options: GRUPO_RIESGO_DEFINITIVO_OPTIONS },
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
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: "./patient-form.component.html",
})
export class PatientFormComponent implements OnDestroy {
  @Output() dataSubmit = new EventEmitter<{ request: ProcesarDatosRequest; response: ProcesarDatosResponse }>();

  readonly fieldGroups = FIELD_GROUPS;
  jsonInput = "";
  jsonParseError: string | null = null;
  submitError: string | null = null;
  isSubmitting = false;
  lastResponse: ProcesarDatosResponse | null = null;
  lastTrainingResponse: NuevaMuestraResponse | null = null;

  form = this.fb.group(
    Object.fromEntries(
      [
        ...ALL_FIELDS.map(({ key, required, defaultValue }) => [
          key,
          required ? [defaultValue ?? null, Validators.required] : [defaultValue ?? null],
        ]),
        ["sendToTraining", [false]],
      ],
    ) as Record<string, any>,
  );

  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, "");
  private readonly defaultFormValues = Object.fromEntries(
    [
      ...ALL_FIELDS.map(({ key, defaultValue }) => [key, defaultValue ?? null]),
      ["sendToTraining", false],
    ],
  ) as Record<string, any>;

  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly dataService: DataService,
  ) {
    this.updateTrainingMode(this.sendToTraining);
    const sendToTrainingCtrl = this.form.get("sendToTraining");
    if (sendToTrainingCtrl) {
      this.subscriptions.add(sendToTrainingCtrl.valueChanges.subscribe((next) => this.updateTrainingMode(next === true)));
    }

    const draft = this.dataService.getDraft();
    if (draft && typeof draft === "object") {
      this.restoreDraft(draft);
    } else {
      this.persistDraft();
    }

    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.schedulePersistDraft()));
  }

  get sendToTraining(): boolean {
    return this.form.get("sendToTraining")?.value === true;
  }

  clearForm(): void {
    this.form.reset(this.defaultFormValues);
    this.jsonParseError = null;
    this.submitError = null;
    this.lastResponse = null;
    this.lastTrainingResponse = null;
    this.updateTrainingMode(false);
    this.jsonInput = "";
    this.dataService.clearDraft();
  }

  onJsonTextChanged(next: string): void {
    this.jsonInput = next ?? "";
    this.jsonParseError = null;
    this.submitError = null;
    this.schedulePersistDraft();
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
      this.jsonParseError = "No s'ha pogut llegir l'arxiu.";
    } finally {
      if (input) input.value = "";
    }
  }

  applyJsonInput(): void {
    this.jsonParseError = null;
    this.submitError = null;
    this.lastTrainingResponse = null;
    const raw = this.jsonInput.trim();
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.jsonParseError = "JSON no vàlid.";
      return;
    }

    const obj = this.extractCandidateObject(parsed);
    if (!obj) {
      this.jsonParseError = "Format JSON no reconegut.";
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
      const rawValue = (obj as any)[key];
      patch[key] = DATE_PATIENT_FIELD_KEYS.includes(key as any)
        ? this.coerceDateString(rawValue)
        : this.coerceNumber(rawValue);
    }

    this.form.patchValue(patch, { emitEvent: false });
    this.persistDraft();
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

  private coerceDateString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toUpperCase() === "NA") return null;
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
      return trimmed;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    }
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      return value.toISOString().slice(0, 10);
    }
    if (Array.isArray(value)) return this.coerceDateString(value[0]);
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, "0")) return this.coerceDateString(obj["0"]);
      const firstKey = Object.keys(obj)[0];
      return firstKey ? this.coerceDateString(obj[firstKey]) : null;
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
    for (const key of NUMERIC_PATIENT_FIELD_KEYS) payload[key] = this.coerceNumber(raw[key]) ?? 0;
    for (const key of DATE_PATIENT_FIELD_KEYS) payload[key] = this.coerceDateString(raw[key]) ?? "";
    return payload as ProcesarDatosRequest;
  }

  private buildTrainingPayload(): NuevaMuestraRequest {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const payload: Partial<NuevaMuestraRequest> = {};
    for (const key of NUMERIC_PATIENT_FIELD_KEYS) payload[key] = this.coerceNumber(raw[key]) ?? 0;
    for (const key of DATE_PATIENT_FIELD_KEYS) payload[key] = this.coerceDateString(raw[key]) ?? "";
    payload["grupo_de_riesgo_definitivo"] = this.coerceNumber(raw["grupo_de_riesgo_definitivo"]) ?? 0;
    return payload as NuevaMuestraRequest;
  }

  private updateTrainingMode(enabled: boolean): void {
    const ctrl = this.form.get("grupo_de_riesgo_definitivo");
    if (!ctrl) return;

    if (enabled) {
      ctrl.enable({ emitEvent: false });
    } else {
      ctrl.disable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  private schedulePersistDraft(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistDraft(), 50);
  }

  ngOnDestroy(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.subscriptions.unsubscribe();
  }

  private persistDraft(): void {
    this.dataService.setDraft({
      form: this.form.getRawValue(),
      jsonInput: this.jsonInput,
    });
  }

  private restoreDraft(draft: any): void {
    const formDraft = draft && typeof draft === "object" ? (draft as any).form : null;
    const jsonDraft = draft && typeof draft === "object" ? (draft as any).jsonInput : null;

    if (typeof jsonDraft === "string") this.jsonInput = jsonDraft;
    if (formDraft && typeof formDraft === "object") {
      this.form.reset({ ...this.defaultFormValues, ...(formDraft as any) }, { emitEvent: false });
      this.updateTrainingMode(this.sendToTraining);
    }
    this.cdr.markForCheck();
  }

  private submitRequest<TResponse>(path: string, request: unknown, onSuccess: (resp: TResponse) => void): void {
    this.isSubmitting = true;
    this.http
      .post<TResponse>(`${this.apiBaseUrl}${path}`, request)
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        catchError((err) => throwError(() => this.humanizeSubmitError(err))),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (resp) => {
          onSuccess(resp);
          this.cdr.markForCheck();
        },
        error: (err: Error) => {
          this.submitError = err.message;
          this.cdr.markForCheck();
        },
      });
  }

  submitToBackend(): void {
    this.jsonParseError = null;
    this.submitError = null;
    this.lastResponse = null;
    this.lastTrainingResponse = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.sendToTraining) {
      const request = this.buildTrainingPayload();
      this.submitRequest<NuevaMuestraResponse>("/nuevaMuestra", request, (resp) => {
        this.lastTrainingResponse = resp;
        this.clearForm();
      });
      return;
    }

    const request = this.buildRequestPayload();
    this.submitRequest<ProcesarDatosResponse>("/procesarDatos", request, (resp) => {
      this.lastResponse = resp;
      this.dataSubmit.emit({ request, response: resp });
      this.persistDraft();
    });
  }

  private humanizeSubmitError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const maybeDetail = (err.error && typeof err.error === "object" ? (err.error as any).detail : null) as unknown;
      if (typeof maybeDetail === "string" && maybeDetail.trim()) return new Error(maybeDetail.trim());
      if (Array.isArray(maybeDetail)) return new Error("Dades no vàlides (422). Revisa els camps.");
      if (err.status === 401) return new Error("No autoritzat. Inicia sessió de nou.");
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error("No s'ha pogut connectar amb el backend.");
    }
    if (err instanceof Error) return err;
    return new Error("Error inesperat.");
  }
}
