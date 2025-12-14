import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, catchError, map, tap, throwError, timeout } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthState, Token, User, UserCreate } from "./auth.models";

type LoginFormData = {
  username: string;
  password: string;
  grant_type?: string;
};

const STORAGE_KEY = "checktherisk.auth";

function asNonEmptyString(value: unknown): string | null {
  const txt = typeof value === "string" ? value.trim() : "";
  return txt ? txt : null;
}

function asUser(username: string, backend: "demo" | "api"): User {
  return {
    name: username.split("@", 1)[0],
    username,
    backend,
  };
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

  login(username: string, password: string, demoMode: boolean): Observable<AuthState> {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    return this.http
      .post<Token>(`${this.apiBaseUrl}/login`, formData)
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
        map((resp) => {
          const token = asNonEmptyString(resp.access_token);
          if (!token) {
            throw new Error("Login correcte però sense token en la resposta.");
          }
          return {
            token,
            user: asUser(username, "api"),
            demoMode: false,
          };
        }),
        tap((nextState) => this.setState(nextState)),
        catchError((err) => throwError(() => this.humanizeError(err))),
      );
  }

  register(username: string, password: string, demoMode: boolean = false): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.apiBaseUrl}/register`, { username, password })
      .pipe(
        timeout({ first: environment.requestTimeoutMs }),
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
      
      if (err.status === 401) return new Error("Usuari o contrasenya incorrectes.");
      if (err.status) return new Error(`Error del backend (${err.status}).`);
      return new Error("No s'ha pogut connectar amb el backend.");
    }
    if (err instanceof Error) return err;
    return new Error("Error inesperat.");
  }
}
