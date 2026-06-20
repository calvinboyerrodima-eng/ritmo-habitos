"use client";
import { HabitsList } from "@/components/habits/habits-list";

export default function HabitsPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hábitos</p>
        <h1 className="text-2xl font-semibold">Tu lista</h1>
      </div>
      <HabitsList />
    </div>
  );
}
