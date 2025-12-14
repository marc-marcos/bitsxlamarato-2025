import { ImportedValue } from "./import.models";

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function detectDelimiter(text: string): string {
  const candidates = [",", ";", "\t"] as const;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .slice(0, 10);

  if (!lines.length) return ",";

  let best: { delimiter: string; score: number } = { delimiter: ",", score: -1 };

  for (const delimiter of candidates) {
    const score =
      lines.reduce((acc, line) => acc + Math.max(0, splitCsvLine(line, delimiter).length - 1), 0) / lines.length;
    if (score > best.score) best = { delimiter, score };
  }

  return best.delimiter;
}

function parseCsvRows(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line || !line.trim()) continue;
    const row = splitCsvLine(line, delimiter);
    if (!row.some((cell) => cell.trim() !== "")) continue;
    rows.push(row);
  }

  return rows;
}

function inferHasHeader(rows: string[][], columnIdx: number): boolean {
  if (rows.length < 2) return false;
  const first = (rows[0][columnIdx] ?? "").trim();
  const second = (rows[1][columnIdx] ?? "").trim();
  if (!first) return false;

  const firstHasLetters = /[a-zA-Záéíóúñ]/.test(first);
  const secondHasLetters = /[a-zA-Záéíóúñ]/.test(second);

  if (firstHasLetters && !secondHasLetters) return true;
  if (/^(id|patient|paciente|valor|valores|values?)$/i.test(first)) return true;
  return false;
}

function parseCsvColumn(text: string): { columnName: string; values: unknown[] } {
  const rows = parseCsvRows(text);
  if (!rows.length) throw new Error("El CSV està buit.");

  const maxCols = rows.reduce((m, row) => Math.max(m, row.length), 0);
  let columnIdx = 0;

  if (maxCols > 1) {
    columnIdx = Array.from({ length: maxCols }, (_, idx) => idx).reduce((best, idx) => {
      const count = rows.reduce((acc, row) => acc + (row[idx] && row[idx].trim() ? 1 : 0), 0);
      const bestCount = rows.reduce((acc, row) => acc + (row[best] && row[best].trim() ? 1 : 0), 0);
      return count > bestCount ? idx : best;
    }, 0);
  }

  const hasHeader = inferHasHeader(rows, columnIdx);
  let columnName = "Valores";
  const dataRows = hasHeader && rows.length > 1 ? rows.slice(1) : rows;
  if (hasHeader) {
    columnName = rows[0][columnIdx] || "Valores";
  }

  const values = dataRows.filter((row) => row.length > columnIdx).map((row) => row[columnIdx]);
  if (!values.length) throw new Error("No s'han trobat valors a la columna seleccionada.");

  return { columnName, values };
}

function parseJsonColumn(text: string): { columnName: string; values: unknown[] } {
  const payload = JSON.parse(text.replace(/^\uFEFF/, ""));

  if (Array.isArray(payload)) {
    if (!payload.length) throw new Error("No s'han trobat valors al JSON.");
    return { columnName: "Valores", values: payload };
  }

  if (payload && typeof payload === "object") {
    const entries = Object.entries(payload as Record<string, unknown>);
    if (!entries.length) throw new Error("No s'han trobat valors al JSON.");

    if (entries.length === 1) {
      const [columnName, maybeList] = entries[0];
      if (Array.isArray(maybeList)) return { columnName, values: maybeList };
      return { columnName, values: [maybeList] };
    }

    const values = entries.map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
    return { columnName: "Valores", values };
  }

  return { columnName: "Valores", values: [payload] };
}

export function extractColumnValues(text: string, filename: string): { columnName: string; values: unknown[] } {
  const name = (filename || "").toLowerCase();
  if (name.endsWith(".json")) return parseJsonColumn(text);
  if (name.endsWith(".csv")) return parseCsvColumn(text);

  try {
    return parseJsonColumn(text);
  } catch {
    return parseCsvColumn(text);
  }
}

function isNumeric(text: string): boolean {
  const val = text.trim();
  if (!val) return false;
  return /^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(val);
}

export function normalizeImportValue(raw: unknown): ImportedValue {
  if (raw === null || raw === undefined) {
    return { text: "—", type: "Buit", icon: "remove_circle_outline" };
  }

  const text = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
  const clean = text.trim();
  if (!clean) {
    return { text: "—", type: "Buit", icon: "remove_circle_outline" };
  }

  const lower = clean.toLowerCase();
  if (["true", "false", "si", "sí", "no"].includes(lower)) {
    return { text: clean, type: "Booleà", icon: "toggle_on" };
  }

  const numericCandidate = clean.replace(",", ".");
  if (isNumeric(numericCandidate)) {
    return { text: clean, type: "Nombre", icon: "numbers" };
  }

  return { text: clean, type: "Text", icon: "text_fields" };
}
