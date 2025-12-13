import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, catchError, from, map, tap, throwError, timeout } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthState, User } from "./auth.models";
import { demoLogin } from "./mock-backend";

type LoginResponse = {
  access_token?: unknown;
  token?: unknown;
  user?: unknown;
};

const STORAGE_KEY = "checktherisk.auth";

function asNonEmptyString(value: unknown): string | null {
  const txt = typeof value === "string" ? value.trim() : "";
  return txt ? txt : null;
}

function asUser(value: unknown, fallbackEmail: string, backend: "demo" | "api"): User {
  if (value && typeof value === "object") {
    const anyUser = value as Partial<User>;
    if (typeof anyUser.email === "string" && anyUser.email.trim()) {
      return {
        name: typeof anyUser.name === "string" && anyUser.name.trim() ? anyUser.name.trim() : fallbackEmail.split("@", 1)[0],
        email: anyUser.email.trim(),
        role: typeof anyUser.role === "string" ? anyUser.role : undefined,
        backend,
      };
    }
  }
  return { name: fallbackEmail.split("@", 1)[0], email: fallbackEmail, backend };
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, "");

  private readonly subject = new BehaviorSubject<AuthState>({
    token: null,
    user: null,
    demoMode: environment.demoModeDefault,
  });

  readonly state$ = this.subject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.restore();
  }

  get state(): AuthState {
    return this.subject.value;
  }

  get token(): string | null {
    return this.state.token;
  }

  get user(): User | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return Boolean(this.state.token);
  }

  login(email: string, password: string, demoMode: boolean): Observable<AuthState> {
    if (demoMode) {
      return from(demoLogin(email, password)).pipe(
        map(({ token, user }) => ({ token, user, demoMode })),
        tap((nextState) => this.setState(nextState)),
      );
    }

    return this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        map((resp) => {
          const token = asNonEmptyString(resp.access_token) ?? asNonEmptyString(resp.token);
          if (!token) {
            throw new Error("Login correcto pero sin token en la respuesta.");
          }
          return {
            token,
            user: asUser(resp.user, email, "api"),
            demoMode,
          };
        }),
        tap((nextState) => this.setState(nextState)),
        catchError((err) => throwError(() => this.humanizeError(err))),
      );
  }

  logout(): void {
    this.setState({ token: null, user: null, demoMode: environment.demoModeDefault });
  }

  private setState(nextState: AuthState): void {
    this.subject.next(nextState);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.subject.value));
    } catch {
      // ignore
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AuthState>;
      this.subject.next({
        token: typeof parsed.token === "string" ? parsed.token : null,
        user: parsed.user && typeof parsed.user === "object" ? (parsed.user as User) : null,
        demoMode: typeof parsed.demoMode === "boolean" ? parsed.demoMode : environment.demoModeDefault,
      });
    } catch {
      // ignore
    }
  }

  private humanizeError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const maybeDetail = (err.error && typeof err.error === "object" ? (err.error as any).detail : null) as unknown;
      if (typeof maybeDetail === "string" && maybeDetail.trim()) return new Error(maybeDetail.trim());
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error("No se pudo conectar con el backend.");
    }
    if (err instanceof Error) return err;
    return new Error("Error inesperado.");
  }
}
