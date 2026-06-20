"use client";
import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { DAY_LABELS_ES_SHORT, WEEK_DAYS_MON_FIRST } from "@/lib/dates";
import type { Habit } from "@/lib/types";

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
      </Card>
    </Link>
  );
}
