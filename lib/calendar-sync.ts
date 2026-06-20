import { differenceInCalendarDays } from "date-fns";
import { db } from "./db";
import {
  createEvent,
  deleteEvent,
  ensureCalendar,
  requestToken,
} from "./google-calendar";
import { combine, addMinutes, dow, rangeDays, ymd } from "./dates";
import type { Habit, ScheduledEvent } from "./types";
import { useApp } from "./store";
import { uuid } from "./utils";
import {
  DEFAULT_SYNC_WINDOW_DAYS,
  SYNC_REFRESH_THRESHOLD_DAYS,
} from "./google-config";

interface SyncCtx {
  token: string;
  calendarId: string;
}

async function getCtx(prompt: "" | "consent" = ""): Promise<SyncCtx> {
  const { settings, setSettings } = useApp.getState();
  if (!settings.googleClientId) {
    throw new Error("Configurá el Client ID en Settings primero.");
  }
  const token = await requestToken({ clientId: settings.googleClientId, prompt });
  let calendarId = settings.calendarId;
  if (!calendarId) {
    calendarId = await ensureCalendar(token, settings.calendarName);
    setSettings({ calendarId });
  }
  return { token, calendarId };
}

function buildEventsForHabit(
  habit: Habit,
  from: Date,
  days: number,
): Omit<ScheduledEvent, "googleEventId" | "createdAt">[] {
  const out: Omit<ScheduledEvent, "googleEventId" | "createdAt">[] = [];
  for (const d of rangeDays(from, days)) {
    const slot = habit.schedule[dow(d)];
    if (!slot || !slot.startTime) continue;
    out.push({
      id: uuid(),
      habitId: habit.id,
      date: ymd(d),
      dayOfWeek: dow(d),
      startTime: slot.startTime,
      durationMin: slot.durationMin,
      status: "scheduled",
    });
  }
  return out;
}

export async function syncHabitEvents(habit: Habit): Promise<number> {
  const ctx = await getCtx();
  const today = new Date();

  // existentes futuros
  const existing = await db.events
    .where("habitId")
    .equals(habit.id)
    .toArray();
  const existingByDate = new Map<string, ScheduledEvent>();
  for (const e of existing) {
    if (e.date >= ymd(today)) existingByDate.set(e.date, e);
  }

  const desired = buildEventsForHabit(habit, today, DEFAULT_SYNC_WINDOW_DAYS);
  const desiredDates = new Set(desired.map((d) => d.date));

  // borrar los que ya no van
  let removed = 0;
  for (const [date, e] of Array.from(existingByDate.entries())) {
    if (!desiredDates.has(date)) {
      if (e.googleEventId) {
        try {
          await deleteEvent(ctx.token, ctx.calendarId, e.googleEventId);
        } catch {
          /* siga */
        }
      }
      await db.events.delete(e.id);
      removed += 1;
    }
  }

  // crear los nuevos
  let created = 0;
  for (const d of desired) {
    const ex = existingByDate.get(d.date);
    if (ex) continue;
    const date = new Date(`${d.date}T00:00:00`);
    const start = combine(date, d.startTime);
    const end = addMinutes(start, d.durationMin);
    const ev = await createEvent(ctx.token, ctx.calendarId, {
      summary: `${habit.emoji} ${habit.name}`,
      description: habit.notes ?? "",
      start,
      end,
      reminderMinutes: habit.reminderMinutes,
    });
    const full: ScheduledEvent = {
      ...d,
      googleEventId: ev.id,
      createdAt: new Date().toISOString(),
    };
    await db.events.put(full);
    created += 1;
  }
  void removed;
  return created;
}

export async function deleteHabitEvents(habitId: string): Promise<void> {
  const ctx = await getCtx();
  const today = ymd(new Date());
  const futures = await db.events
    .where("habitId")
    .equals(habitId)
    .filter((e) => e.date >= today)
    .toArray();
  for (const e of futures) {
    if (e.googleEventId) {
      try {
        await deleteEvent(ctx.token, ctx.calendarId, e.googleEventId);
      } catch {
        /* siga */
      }
    }
    await db.events.delete(e.id);
  }
}

export async function extendSyncWindowIfNeeded(): Promise<void> {
  const events = await db.events.toArray();
  if (events.length === 0) return;
  const today = new Date();
  const dates = events.map((e) => e.date).sort();
  const last = dates[dates.length - 1];
  const daysLeft = differenceInCalendarDays(new Date(`${last}T00:00:00`), today);
  if (daysLeft >= SYNC_REFRESH_THRESHOLD_DAYS) return;

  const habits = await db.habits.toArray();
  for (const h of habits.filter((x) => !x.archivedAt)) {
    await syncHabitEvents(h);
  }
  useApp.getState().setSettings({ lastSyncAt: new Date().toISOString() });
}

export async function resyncAll(): Promise<{ habits: number; events: number }> {
  const habits = (await db.habits.toArray()).filter((h) => !h.archivedAt);
  let evts = 0;
  for (const h of habits) {
    evts += await syncHabitEvents(h);
  }
  useApp.getState().setSettings({ lastSyncAt: new Date().toISOString() });
  return { habits: habits.length, events: evts };
}

export async function snoozeOneHour(eventId: string): Promise<void> {
  const ev = await db.events.get(eventId);
  if (!ev) return;
  const ctx = await getCtx();
  const [h, m] = ev.startTime.split(":").map(Number);
  const newH = (h + 1) % 24;
  const newStartTime = `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const date = new Date(`${ev.date}T00:00:00`);
  const start = combine(date, newStartTime);
  const end = addMinutes(start, ev.durationMin);
  if (ev.googleEventId) {
    const { patchEvent } = await import("./google-calendar");
    await patchEvent(ctx.token, ctx.calendarId, ev.googleEventId, {
      start,
      end,
    });
  }
  await db.events.update(eventId, {
    originalStartTime: ev.originalStartTime ?? ev.startTime,
    startTime: newStartTime,
    status: "snoozed",
  });
}
