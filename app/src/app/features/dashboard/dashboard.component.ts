import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/auth/auth.service";
import { ImportedValue } from "../../core/import/import.models";
import { extractColumnValues, normalizeImportValue } from "../../core/import/import.utils";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {
  readonly appName = environment.appName;

  importedColumnName = "Sin datos importados";
  importedValues: ImportedValue[] = [];

  get importedSubtitle(): string {
    return this.importedValues.length
      ? `${this.importedValues.length} valores detectados`
      : "Importa un CSV o JSON con una sola columna de valores para el paciente.";
  }

  @ViewChild("fileInput", { static: true }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl("/login");
  }

  openImportDialog(): void {
    this.fileInput.nativeElement.value = "";
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { columnName, values } = extractColumnValues(text, file.name || "");
      this.importedColumnName = columnName || "Sin datos importados";
      this.importedValues = values.map((v) => normalizeImportValue(v));
      this.snackBar.open(`${file.name} importado correctamente.`, "Cerrar", { duration: 3500 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.snackBar.open(`No se pudo importar el archivo: ${message}`, "Cerrar", { duration: 4500 });
    }
  }
}
