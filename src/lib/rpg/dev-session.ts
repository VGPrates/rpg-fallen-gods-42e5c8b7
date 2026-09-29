import type { Role } from "./types";

const KEY = "mesa-dev-session";

export type DevSession = {
  userId: string;
  nick: string;
  role: Role;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeDevSession(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readDevSession(): DevSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevSession;
    if (!parsed?.userId || !parsed.nick || (parsed.role !== "gm" && parsed.role !== "player")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDevSession(session: DevSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
  emit();
}

export function clearDevSession() {
  localStorage.removeItem(KEY);
  emit();
}

export function isLocalDevAuth() {
  return true;
}

export function sessionUserId() {
  const s = readDevSession();
  if (!s) throw new Error("Não autenticado.");
  return s.userId;
}
