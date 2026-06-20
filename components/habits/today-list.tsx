"use client";
import * as React from "react";
import { Check, ChevronsRight, SkipForward, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ymd } from "@/lib/dates";
import { snoozeOneHour } from "@/lib/calendar-sync";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { uuid } from "@/lib/utils";
import type { Habit, ScheduledEvent } from "@/lib/types";

export function TodayList() {
  const { toast } = useToast();
  const clientId = useApp((s) => s.settings.googleClientId);
  const today = ymd(new Date());

  const data = useLiveQuery(async () => {
    const events = await db.events
      .where("date")
      .equals(today)
      .toArray();
    const habits = await db.habits.toArray();
    const compIds = events.map((e) => `${e.habitId}_${today}`);
    const comps = await db.completions.where("id").anyOf(compIds).toArray();
    const byHabit = new Map(habits.map((h) => [h.id, h]));
    const byComp = new Map(comps.map((c) => [c.id, c]));
    return events
      .filter((e) => byHabit.get(e.habitId) && !byHabit.get(e.habitId)?.archivedAt)
      .map((e) => ({
        event: e,
        habit: byHabit.get(e.habitId)!,
        completion: byComp.get(`${e.habitId}_${today}`),
      }))
      .sort((a, b) => a.event.startTime.localeCompare(b.event.startTime));
  }, [today]);

  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (data.length === 0) {
    return (
      <Card className="grid place-items-center gap-2 p-8 text-center">
        <div className="text-4xl">🌱</div>
        <p className="text-sm font-medium">Día libre.</p>
        <p className="text-xs text-muted-foreground">
          No tenés hábitos agendados para hoy. Creá uno desde &ldquo;Hábitos&rdquo;.
        </p>
      </Card>
    );
  }

  async function markDone(habit: Habit, ev: ScheduledEvent) {
    const compId = `${habit.id}_${today}`;
    await db.completions.put({
      id: compId,
      habitId: habit.id,
      date: today,
      status: "done",
      completedAt: new Date().toISOString(),
    });
    await db.events.update(ev.id, { status: "done" });
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: [habit.color, "#22C55E", "#F59E0B"],
    });
  }

  async function markSkipped(habit: Habit, ev: ScheduledEvent) {
    const compId = `${habit.id}_${today}`;
    await db.completions.put({
      id: compId,
      habitId: habit.id,
      date: today,
      status: "skipped",
    });
    await db.events.update(ev.id, { status: "skipped" });
  }

  async function postpone(ev: ScheduledEvent) {
    try {
      if (!clientId) {
        toast({ title: "Configurá Google primero para posponer" });
        return;
      }
      await snoozeOneHour(ev.id);
      toast({ title: "Pospuesto 1 hora" });
    } catch (e) {
      toast({ title: "No se pudo posponer", description: (e as Error).message });
    }
  }

  // touch uuid import so eslint not whining
  void uuid;

  return (
    <div className="grid gap-2">
      <AnimatePresence initial={false}>
        {data.map(({ event, habit, completion }) => {
          const isDone = completion?.status === "done";
          const isSkipped = completion?.status === "skipped";
          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Card
                className={`flex items-center gap-3 p-3 ${
                  isDone ? "opacity-60" : ""
                }`}
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg text-lg"
                  style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
                >
                  {habit.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-medium ${isDone ? "line-through" : ""}`}>
                      {habit.name}
                    </p>
                    {isSkipped && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Saltado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {event.startTime} · {event.durationMin} min
                    </span>
                  </div>
                </div>
                {!isDone && !isSkipped && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => postpone(event)}
                      title="Posponer 1 h"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markSkipped(habit, event)}
                      title="Saltar"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => markDone(habit, event)}
                      title="Hecho"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
