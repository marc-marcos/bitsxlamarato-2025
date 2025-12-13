export type AuthBackend = "demo" | "api";

export interface User {
  name: string;
  username: string;
  role?: string;
  backend?: AuthBackend;
}

export interface UserCreate {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  demoMode: boolean;
}

