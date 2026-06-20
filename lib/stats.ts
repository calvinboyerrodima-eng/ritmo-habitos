import { addDays, differenceInCalendarDays, format, subDays } from "date-fns";
import { db } from "./db";
import { ymd, parseYmd, WEEK_DAYS_MON_FIRST } from "./dates";
import type { Completion, Habit } from "./types";

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  weekRate: number; // 0..1
  monthRate: number; // 0..1
  doneCount: number;
  scheduledCount: number;
}

function isScheduled(habit: Habit, date: Date): boolean {
  const slot = habit.schedule[date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  return !!slot && !!slot.startTime;
}

export async function computeHabitStats(habit: Habit, refDate = new Date()): Promise<HabitStats> {
  const comps = await db.completions
    .where("habitId")
    .equals(habit.id)
    .toArray();
  const byDate = new Map<string, Completion>(comps.map((c) => [c.date, c]));

  // streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;
  let cursor = new Date(refDate);
  // walk backwards while consecutive scheduled days were done
  while (true) {
    if (!isScheduled(habit, cursor)) {
      cursor = subDays(cursor, 1);
      if (differenceInCalendarDays(refDate, cursor) > 365) break;
      continue;
    }
    const c = byDate.get(ymd(cursor));
    if (c?.status === "done") {
      currentStreak += 1;
      cursor = subDays(cursor, 1);
    } else {
      // hoy puede estar pendiente sin romper streak
      if (differenceInCalendarDays(refDate, cursor) === 0) {
        cursor = subDays(cursor, 1);
        continue;
      }
      break;
    }
  }

  // best streak histórico: recorrer todas las fechas con completions ordenadas
  const sortedDates = Array.from(byDate.keys()).sort();
  let prev: Date | null = null;
  for (const d of sortedDates) {
    const date = parseYmd(d);
    const c = byDate.get(d);
    if (c?.status !== "done") {
      running = 0;
      prev = null;
      continue;
    }
    if (prev && differenceInCalendarDays(date, prev) === 1) {
      running += 1;
    } else {
      running = 1;
    }
    bestStreak = Math.max(bestStreak, running);
    prev = date;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // rates últimos 7 y 30 días
  const r = (days: number) => {
    let scheduled = 0;
    let done = 0;
    for (let i = 0; i < days; i++) {
      const d = subDays(refDate, i);
      if (!isScheduled(habit, d)) continue;
      scheduled += 1;
      const c = byDate.get(ymd(d));
      if (c?.status === "done") done += 1;
    }
    return { scheduled, done };
  };
  const w = r(7);
  const m = r(30);

  return {
    currentStreak,
    bestStreak,
    weekRate: w.scheduled === 0 ? 0 : w.done / w.scheduled,
    monthRate: m.scheduled === 0 ? 0 : m.done / m.scheduled,
    doneCount: m.done,
    scheduledCount: m.scheduled,
  };
}

export interface HeatmapCell {
  date: string;
  scheduled: number;
  done: number;
  rate: number; // 0..1
}

export async function computeHeatmap(month: Date): Promise<HeatmapCell[]> {
  const habits = await db.habits.where("archivedAt").equals("").or("archivedAt").equals(null as never).toArray();
  // Dexie no acepta null en where directly — fallback: get all and filter
  const allHabits = await db.habits.toArray();
  const activeHabits = allHabits.filter((h) => !h.archivedAt);

  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days = differenceInCalendarDays(end, start) + 1;

  const comps = await db.completions
    .where("date")
    .between(ymd(start), ymd(end), true, true)
    .toArray();

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const date = ymd(d);
    let scheduled = 0;
    let done = 0;
    for (const h of activeHabits) {
      if (isScheduled(h, d)) {
        scheduled += 1;
        const c = comps.find((x) => x.habitId === h.id && x.date === date);
        if (c?.status === "done") done += 1;
      }
    }
    cells.push({
      date,
      scheduled,
      done,
      rate: scheduled === 0 ? 0 : done / scheduled,
    });
  }
  // silenciar var no usada para evitar warning
  void habits;
  return cells;
}

export interface BestSlot {
  label: string;
  rate: number;
  count: number;
}

export async function computeBestDaysHours(habit: Habit): Promise<{ days: BestSlot[]; hours: BestSlot[] }> {
  const comps = await db.completions.where("habitId").equals(habit.id).toArray();
  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const dayBuckets = new Map<number, { done: number; total: number }>();
  for (let i = 0; i < 7; i++) dayBuckets.set(i, { done: 0, total: 0 });

  for (const c of comps) {
    const dow = parseYmd(c.date).getDay();
    const b = dayBuckets.get(dow)!;
    b.total += 1;
    if (c.status === "done") b.done += 1;
  }
  const days: BestSlot[] = WEEK_DAYS_MON_FIRST.map((d) => ({
    label: dayLabels[d],
    rate: dayBuckets.get(d)!.total === 0 ? 0 : dayBuckets.get(d)!.done / dayBuckets.get(d)!.total,
    count: dayBuckets.get(d)!.done,
  }));

  // horas: bucket por hora del slot del hábito ese día (si está done)
  const hourBuckets = new Map<number, number>();
  for (const c of comps) {
    if (c.status !== "done") continue;
    const dow = parseYmd(c.date).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const slot = habit.schedule[dow];
    if (!slot?.startTime) continue;
    const h = parseInt(slot.startTime.slice(0, 2), 10);
    hourBuckets.set(h, (hourBuckets.get(h) ?? 0) + 1);
  }
  const hours: BestSlot[] = Array.from(hourBuckets.entries())
    .map(([h, count]) => ({ label: `${String(h).padStart(2, "0")}:00`, rate: 0, count }))
    .sort((a, b) => b.count - a.count);

  return { days, hours };
}

export async function computeHabitTimeline(
  habit: Habit,
  days = 30,
  refDate = new Date(),
): Promise<{ date: string; rate: number; done: number }[]> {
  const start = subDays(refDate, days - 1);
  const comps = await db.completions
    .where("habitId")
    .equals(habit.id)
    .toArray();
  const byDate = new Map(comps.map((c) => [c.date, c]));
  const out: { date: string; rate: number; done: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const date = ymd(d);
    const sched = isScheduled(habit, d) ? 1 : 0;
    const c = byDate.get(date);
    const done = c?.status === "done" ? 1 : 0;
    out.push({
      date: format(d, "dd/MM"),
      rate: sched === 0 ? 0 : done,
      done,
    });
  }
  return out;
}
