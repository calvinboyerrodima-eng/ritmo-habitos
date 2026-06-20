/**
 * Cliente Google Calendar usando Google Identity Services (GIS) para OAuth
 * implicit-style desde el navegador. Maneja:
 *  - carga lazy del script GIS
 *  - request de token con prompt o silencioso
 *  - llamadas REST a Calendar v3 con bearer token
 *  - crear calendario dedicado
 *  - CRUD de eventos
 *
 * El token vive en memoria; cuando expira se reintenta con prompt:"" (silent).
 */

import { CALENDAR_SCOPE } from "./google-config";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const API_BASE = "https://www.googleapis.com/calendar/v3";

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(s);
  });
  return scriptLoading;
}

export async function initTokenClient(clientId: string): Promise<void> {
  if (!clientId) throw new Error("Falta el Client ID de Google");
  await loadScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("GIS no disponible");
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: CALENDAR_SCOPE,
    callback: () => {
      /* setup en requestToken */
    },
  });
}

export async function requestToken(opts: {
  clientId: string;
  prompt?: "" | "consent" | "select_account" | "none";
}): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - 30_000 > Date.now()) {
    return cachedToken.accessToken;
  }
  if (!tokenClient) {
    await initTokenClient(opts.clientId);
  }
  return new Promise<string>((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Token client no inicializado"));
      return;
    }
    (tokenClient as unknown as { callback: (r: google.accounts.oauth2.TokenResponse) => void }).callback = (resp) => {
      if ((resp as { error?: string }).error) {
        reject(new Error(`OAuth error: ${(resp as { error?: string }).error}`));
        return;
      }
      const accessToken = resp.access_token;
      const expiresIn = Number((resp as unknown as { expires_in?: number }).expires_in ?? 3500);
      cachedToken = {
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      resolve(accessToken);
    };
    try {
      tokenClient.requestAccessToken({ prompt: opts.prompt ?? "" });
    } catch (e) {
      reject(e as Error);
    }
  });
}

export function clearToken() {
  cachedToken = null;
}

export function hasValidToken() {
  return !!cachedToken && cachedToken.expiresAt > Date.now();
}

async function api<T>(
  path: string,
  init: RequestInit & { token: string },
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Calendar API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface GCalendar {
  id: string;
  summary: string;
}

export async function listCalendars(token: string): Promise<GCalendar[]> {
  const j = await api<{ items?: GCalendar[] }>("/users/me/calendarList", {
    token,
    method: "GET",
  });
  return j.items ?? [];
}

export async function createCalendar(token: string, name: string): Promise<GCalendar> {
  return api<GCalendar>("/calendars", {
    token,
    method: "POST",
    body: JSON.stringify({ summary: name, timeZone: tz() }),
  });
}

export async function ensureCalendar(token: string, name: string): Promise<string> {
  const list = await listCalendars(token);
  const found = list.find((c) => c.summary === name);
  if (found) return found.id;
  const created = await createCalendar(token, name);
  return created.id;
}

export interface CalEventInput {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  reminderMinutes: number;
  colorId?: string;
}

export interface CalEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
}

function evtBody(e: CalEventInput) {
  return {
    summary: e.summary,
    description: e.description,
    start: { dateTime: e.start.toISOString(), timeZone: tz() },
    end: { dateTime: e.end.toISOString(), timeZone: tz() },
    colorId: e.colorId,
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: e.reminderMinutes }],
    },
  };
}

export async function createEvent(
  token: string,
  calendarId: string,
  e: CalEventInput,
): Promise<CalEvent> {
  return api<CalEvent>(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    token,
    method: "POST",
    body: JSON.stringify(evtBody(e)),
  });
}

export async function patchEvent(
  token: string,
  calendarId: string,
  eventId: string,
  patch: Partial<CalEventInput>,
): Promise<CalEvent> {
  const body: Record<string, unknown> = {};
  if (patch.summary) body.summary = patch.summary;
  if (patch.description != null) body.description = patch.description;
  if (patch.start) body.start = { dateTime: patch.start.toISOString(), timeZone: tz() };
  if (patch.end) body.end = { dateTime: patch.end.toISOString(), timeZone: tz() };
  if (typeof patch.reminderMinutes === "number") {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: "popup", minutes: patch.reminderMinutes }],
    };
  }
  return api<CalEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { token, method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteEvent(
  token: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  await api<void>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { token, method: "DELETE" },
  );
}

function tz() {
  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
  return "UTC";
}
