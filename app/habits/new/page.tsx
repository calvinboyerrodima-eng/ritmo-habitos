"use client";
import { HabitForm } from "@/components/habits/habit-form";

export default function NewHabitPage() {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Nuevo</p>
        <h1 className="text-2xl font-semibold">Crear hábito</h1>
      </div>
      <HabitForm />
    </div>
  );
}
