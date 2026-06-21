"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { DayOfWeek, WeeklySchedule } from "@/lib/types";

interface Props {
  schedule: WeeklySchedule;
  onApply: (next: WeeklySchedule) => void;
}

type PresetKey = "daily" | "weekdays" | "weekend" | "custom";

const PRESETS: { key: PresetKey; label: string; days: DayOfWeek[] }[] = [
  { key: "daily", label: "Diario", days: [1, 2, 3, 4, 5, 6, 0] },
  { key: "weekdays", label: "L–V", days: [1, 2, 3, 4, 5] },
  { key: "weekend", label: "Sáb–Dom", days: [6, 0] },
  { key: "custom", label: "Personalizado", days: [] },
];

function detectActive(schedule: WeeklySchedule): PresetKey {
  const enabled = ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).filter(
    (d) => !!schedule[d].startTime,
  );
  const setStr = enabled.sort().join(",");
  if (setStr === "0,1,2,3,4,5,6") return "daily";
  if (setStr === "1,2,3,4,5") return "weekdays";
  if (setStr === "0,6") return "weekend";
  return "custom";
}

export function RecurrencePresets({ schedule, onApply }: Props) {
  const active = detectActive(schedule);

  const apply = (preset: PresetKey, days: DayOfWeek[]) => {
    if (preset === "custom") return; // no-op, deja la grilla como está
    // Tomar como referencia la primera hora/duración configurada;
    // si no hay ninguna, usar 09:00 / 30 min.
    const ref =
      ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[])
        .map((d) => schedule[d])
        .find((s) => !!s.startTime) ?? { startTime: "09:00", durationMin: 30 };
    const startTime = ref.startTime ?? "09:00";
    const durationMin = ref.durationMin || 30;
    const next: WeeklySchedule = { ...schedule };
    for (const d of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
      next[d] = days.includes(d)
        ? { startTime, durationMin }
        : { startTime: null, durationMin: schedule[d].durationMin };
    }
    onApply(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => apply(p.key, p.days)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition",
            active === p.key ? "border-primary bg-accent" : "hover:bg-accent",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
