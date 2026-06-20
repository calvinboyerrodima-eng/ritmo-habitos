import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { DayOfWeek } from "./types";

export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
export const parseYmd = (s: string) => parse(s, "yyyy-MM-dd", new Date());

export function dow(d: Date): DayOfWeek {
  return d.getDay() as DayOfWeek;
}

export function combine(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const out = startOfDay(date);
  out.setHours(h, m, 0, 0);
  return out;
}

export function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

export function rangeDays(from: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(from, i));
}

export function weekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthGrid(date: Date): Date[] {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const end = endOfWeek(last, { weekStartsOn: 1 });
  const days = differenceInCalendarDays(end, start) + 1;
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export const DAY_LABELS_ES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAY_LABELS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Días de la semana ordenados Lun-Dom como `DayOfWeek[]`. */
export const WEEK_DAYS_MON_FIRST: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export function fmtTime(hhmm: string | null): string {
  return hhmm ?? "—";
}
