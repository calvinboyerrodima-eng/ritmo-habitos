"use client";
import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Plus, Search } from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { DAY_LABELS_ES_SHORT, WEEK_DAYS_MON_FIRST, ymd } from "@/lib/dates";
import type { DayOfWeek, Habit } from "@/lib/types";

export function HabitsList() {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<string | null>(null);
  const habits = useLiveQuery(async () => {
    const all = await db.habits.toArray();
    return all.filter((h) => !h.archivedAt);
  }, []);

  const categories = React.useMemo(() => {
    if (!habits) return [];
    return Array.from(new Set(habits.map((h) => h.category)));
  }, [habits]);

  const filtered = React.useMemo(() => {
    if (!habits) return [];
    return habits.filter((h) => {
      if (cat && h.category !== cat) return false;
      if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [habits, q, cat]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar hábito…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button asChild size="icon">
          <Link href="/habits/new" aria-label="Nuevo hábito">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-3 py-1 text-xs ${
              cat === null ? "border-primary bg-accent" : "hover:bg-accent"
            }`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs ${
                cat === c ? "border-primary bg-accent" : "hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {habits === undefined ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card className="grid place-items-center gap-2 p-8 text-center">
          <div className="text-4xl">📋</div>
          <p className="text-sm font-medium">Sin hábitos todavía.</p>
          <p className="text-xs text-muted-foreground">
            Tocá el + arriba para crear el primero.
          </p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((h) => (
            <HabitRow key={h.id} habit={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const days = WEEK_DAYS_MON_FIRST.filter((d) => habit.schedule[d].startTime);
  const today = ymd(new Date());
  const todayDow = new Date().getDay() as DayOfWeek;
  const scheduledToday = !!habit.schedule[todayDow].startTime;

  const todayComp = useLiveQuery(
    () => db.completions.get(`${habit.id}_${today}`),
    [habit.id, today],
  );
  const doneToday = todayComp?.status === "done";

  async function markTodayDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await db.completions.put({
      id: `${habit.id}_${today}`,
      habitId: habit.id,
      date: today,
      status: "done",
      completedAt: new Date().toISOString(),
    });
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: [habit.color, "#22C55E", "#F59E0B"],
    });
  }

  return (
    <Link href={`/habits/${habit.id}`}>
      <Card className="flex items-center gap-3 p-3 transition hover:bg-accent">
        <div
          className="grid h-10 w-10 place-items-center rounded-lg text-lg"
          style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
        >
          {habit.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{habit.name}</p>
            <Badge variant="outline" className="text-[10px]">
              {habit.category}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {days.length === 0
              ? "Sin días"
              : days.map((d) => DAY_LABELS_ES_SHORT[d]).join(" · ")}
          </p>
        </div>
        {scheduledToday && (
          doneToday ? (
            <Badge variant="success" className="gap-1 text-[10px]">
              <Check className="h-3 w-3" /> Hoy
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={markTodayDone}
              className="shrink-0"
              title="Marcar hoy como hecho"
            >
              <Check className="h-4 w-4" />
              Hoy
            </Button>
          )
        )}
      </Card>
    </Link>
  );
}
