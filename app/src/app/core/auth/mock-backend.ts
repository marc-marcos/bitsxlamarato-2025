import { User } from "./auth.models";

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const bytes = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    return hexEncode(new Uint8Array(hashBuffer));
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").repeat(8).slice(0, 64);
}

export async function demoLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  if (!email.trim() || !password.trim()) {
    throw new Error("Introduce email y contraseña.");
  }

  const hash = await sha256Hex(email.trim().toLowerCase());
  const token = `demo-${hash.slice(0, 20)}`;
  const name =
    email
      .split("@", 1)[0]
      .replace(/\./g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^|\s)\S/g, (c) => c.toUpperCase()) || "Profesional";

  return {
    token,
    user: {
      name,
      email: email.trim(),
      role: "Equipo clínico",
      backend: "demo",
    },
  };
}
