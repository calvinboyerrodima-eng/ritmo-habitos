"use client";
import * as React from "react";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAY_LABELS_ES_SHORT, WEEK_DAYS_MON_FIRST } from "@/lib/dates";
import type { DayOfWeek, WeeklySchedule } from "@/lib/types";

interface Props {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
}

export function WeeklyScheduleGrid({ value, onChange }: Props) {
  const setSlot = (day: DayOfWeek, patch: Partial<{ startTime: string | null; durationMin: number }>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  const copyToOthers = (day: DayOfWeek) => {
    const src = value[day];
    if (!src.startTime) return;
    const next: WeeklySchedule = { ...value };
    for (const d of WEEK_DAYS_MON_FIRST) {
      if (d === day) continue;
      next[d] = { startTime: src.startTime, durationMin: src.durationMin };
    }
    onChange(next);
  };

  const clearDay = (day: DayOfWeek) => {
    onChange({ ...value, [day]: { startTime: null, durationMin: value[day].durationMin } });
  };

  return (
    <div className="grid gap-2">
      {WEEK_DAYS_MON_FIRST.map((d) => {
        const slot = value[d];
        const empty = !slot.startTime;
        return (
          <div
            key={d}
            className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2 rounded-lg border bg-card px-3 py-2"
          >
            <span className="text-sm font-medium">{DAY_LABELS_ES_SHORT[d]}</span>
            <Input
              type="time"
              value={slot.startTime ?? ""}
              onChange={(e) =>
                setSlot(d, { startTime: e.target.value === "" ? null : e.target.value })
              }
              className="h-9"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={5}
                max={480}
                step={5}
                value={slot.durationMin}
                onChange={(e) => setSlot(d, { durationMin: Number(e.target.value) || 30 })}
                disabled={empty}
                className="h-9"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Copiar a otros días"
                disabled={empty}
                onClick={() => copyToOthers(d)}
                className="h-9 w-9"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Quitar este día"
                disabled={empty}
                onClick={() => clearDay(d)}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const EMPTY_SCHEDULE: WeeklySchedule = {
  0: { startTime: null, durationMin: 30 },
  1: { startTime: null, durationMin: 30 },
  2: { startTime: null, durationMin: 30 },
  3: { startTime: null, durationMin: 30 },
  4: { startTime: null, durationMin: 30 },
  5: { startTime: null, durationMin: 30 },
  6: { startTime: null, durationMin: 30 },
};
