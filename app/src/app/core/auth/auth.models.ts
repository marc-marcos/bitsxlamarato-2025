export type AuthBackend = "demo" | "api";

export interface User {
  name: string;
  email: string;
  role?: string;
  backend?: AuthBackend;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  demoMode: boolean;
}

