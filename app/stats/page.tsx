"use client";
import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Heatmap } from "@/components/stats/heatmap";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { db } from "@/lib/db";
import { computeHabitStats } from "@/lib/stats";
import type { HabitStats } from "@/lib/stats";
import type { Habit } from "@/lib/types";

export default function StatsPage() {
  const habits = useLiveQuery(async () => {
    const all = await db.habits.toArray();
    return all.filter((h) => !h.archivedAt);
  }, []);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Stats</p>
        <h1 className="text-2xl font-semibold">Tu progreso</h1>
      </div>
      <Heatmap />
      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Por hábito
        </p>
        {habits === undefined ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : habits.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Sin hábitos todavía.
          </Card>
        ) : (
          habits.map((h) => <HabitMiniStat key={h.id} habit={h} />)
        )}
      </div>
    </div>
  );
}

function HabitMiniStat({ habit }: { habit: Habit }) {
  const [stats, setStats] = React.useState<HabitStats | null>(null);
  React.useEffect(() => {
    computeHabitStats(habit).then(setStats);
  }, [habit]);

  return (
    <Link href={`/habits/${habit.id}`}>
      <Card className="grid gap-2 p-3 transition hover:bg-accent">
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.emoji}</span>
          <p className="flex-1 truncate text-sm font-medium">{habit.name}</p>
          {stats && (
            <span className="text-xs text-muted-foreground">
              🔥 {stats.currentStreak}
            </span>
          )}
        </div>
        {stats && (
          <Progress value={stats.monthRate} className="h-1.5" />
        )}
      </Card>
    </Link>
  );
}
