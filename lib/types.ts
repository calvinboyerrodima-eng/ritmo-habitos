export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HabitType = "bool" | "quant";

export type ReminderMinutes = 5 | 10 | 15 | 30 | 60 | 120 | number;

export interface DaySlot {
  /** "HH:mm" 24h, vacío = sin slot ese día */
  startTime: string | null;
  /** minutos */
  durationMin: number;
}

export type WeeklySchedule = Record<DayOfWeek, DaySlot>;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex
  category: string;
  type: HabitType;
  target?: number; // sólo si type=quant
  unit?: string; // sólo si type=quant (ej. "vasos", "km")
  notes?: string;
  reminderMinutes: number;
  schedule: WeeklySchedule;
  /** id del Calendar event recurrente o del calendario dedicado; lo manejamos por evento individual */
  archivedAt?: string;
  createdAt: string;
}

export type CompletionStatus = "done" | "skipped" | "pending";

export interface Completion {
  id: string; // `${habitId}_${date}`
  habitId: string;
  date: string; // YYYY-MM-DD (local)
  status: CompletionStatus;
  value?: number; // para quant
  completedAt?: string; // ISO
}

export interface ScheduledEvent {
  id: string; // uuid local
  habitId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  durationMin: number;
  /** id del evento en Google Calendar */
  googleEventId?: string;
  /** Si fue posponido, hora original */
  originalStartTime?: string;
  status: "scheduled" | "done" | "skipped" | "snoozed";
  createdAt: string;
}

export interface AppSettings {
  googleClientId: string;
  calendarId: string | null;
  calendarName: string;
  themeMode: "light" | "dark" | "system";
  lastSyncAt: string | null;
  onboardingCompleted: boolean;
  syncWindowDays: number;
}
