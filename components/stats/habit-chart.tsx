"use client";
import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { computeHabitTimeline, computeBestDaysHours, computeHabitStats, type HabitStats } from "@/lib/stats";
import type { Habit } from "@/lib/types";

export function HabitChart({ habit }: { habit: Habit }) {
  const [data, setData] = React.useState<{ date: string; rate: number }[]>([]);
  const [stats, setStats] = React.useState<HabitStats | null>(null);
  const [best, setBest] = React.useState<{ days: { label: string; rate: number; count: number }[]; hours: { label: string; count: number }[] } | null>(null);

  React.useEffect(() => {
    computeHabitTimeline(habit, 30).then(setData);
    computeHabitStats(habit).then(setStats);
    computeBestDaysHours(habit).then((b) =>
      setBest({ days: b.days, hours: b.hours.map((h) => ({ label: h.label, count: h.count })) }),
    );
  }, [habit]);

  return (
    <div className="grid gap-3">
      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">Últimos 30 días</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={10} interval={4} />
              <YAxis domain={[0, 1]} hide />
              <Tooltip formatter={(v) => (Number(v) === 1 ? "Hecho" : "—")} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={habit.color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {stats && (
        <Card className="grid grid-cols-2 gap-3 p-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Racha actual</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.bestStreak}</p>
            <p className="text-xs text-muted-foreground">Mejor racha</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{Math.round(stats.weekRate * 100)}%</p>
            <p className="text-xs text-muted-foreground">Semana</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{Math.round(stats.monthRate * 100)}%</p>
            <p className="text-xs text-muted-foreground">Mes</p>
          </div>
        </Card>
      )}

      {best && (
        <Card className="grid gap-3 p-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Mejores días
            </p>
            <div className="flex flex-wrap gap-1.5">
              {best.days.map((d) => (
                <div
                  key={d.label}
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{ opacity: 0.5 + d.rate * 0.5 }}
                >
                  {d.label} · {Math.round(d.rate * 100)}%
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Mejores horas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {best.hours.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sin datos aún.</span>
              ) : (
                best.hours.slice(0, 5).map((h) => (
                  <div key={h.label} className="rounded-md border px-2 py-1 text-xs">
                    {h.label} · {h.count}×
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
