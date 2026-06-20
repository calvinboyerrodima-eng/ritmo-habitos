/**
 * OAuth Client ID por defecto. Sobreescribible desde /settings.
 * Si se deja vacío, la app pide al usuario que lo configure manualmente.
 *
 * Para reemplazar este valor sin tocar código:
 *   - Configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID en Vercel/.env
 *   - O ir a Settings y pegarlo ahí (queda en localStorage)
 */
export const DEFAULT_GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export const DEFAULT_CALENDAR_NAME = "Ritmo - Hábitos";

export const DEFAULT_SYNC_WINDOW_DAYS = 30;
export const SYNC_REFRESH_THRESHOLD_DAYS = 14;
