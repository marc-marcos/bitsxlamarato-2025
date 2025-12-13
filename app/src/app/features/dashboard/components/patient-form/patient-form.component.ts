import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

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
] as const;

type PatientFieldKey = (typeof PATIENT_FIELD_KEYS)[number];

type PatientBackendPayload = Record<PatientFieldKey, number | null>;

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
  { value: 2, label: "IA2" },  { value: 3, label: "IA3" },
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
  @Output() analyze = new EventEmitter<PatientBackendPayload>();

  readonly fieldGroups = FIELD_GROUPS;
  jsonInput = "";
  jsonParseError: string | null = null;

  form = this.fb.group(
    Object.fromEntries(
      ALL_FIELDS.map(({ key, required }) => [key, required ? [null, Validators.required] : [null]]),
    ) as Record<PatientFieldKey, any>,
  );

  constructor(private fb: FormBuilder) {}

  clearForm(): void {
    this.form.reset();
    this.jsonParseError = null;
  }

  async onJsonFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      this.jsonInput = await file.text();
      this.jsonParseError = null;
      this.applyJsonInput();
    } catch {
      this.jsonParseError = "No se pudo leer el archivo.";
    } finally {
      if (input) input.value = "";
    }
  }

  applyJsonInput(): void {
    this.jsonParseError = null;
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

  private getPayload(): PatientBackendPayload {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const payload: Partial<PatientBackendPayload> = {};
    for (const { key } of ALL_FIELDS) payload[key] = this.coerceNumber(raw[key]);
    return payload as PatientBackendPayload;
  }

  onAnalyze(): void {
    if (this.form.valid) {
      this.analyze.emit(this.getPayload());
    } else {
      this.form.markAllAsTouched();
    }
  }
}
