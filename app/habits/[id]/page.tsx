"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitChart } from "@/components/stats/habit-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const habit = useLiveQuery(() => db.habits.get(params.id), [params.id]);

  if (habit === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (!habit) {
    router.replace("/habits");
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-lg text-2xl"
          style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
        >
          {habit.emoji}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {habit.category}
          </p>
          <h1 className="text-2xl font-semibold">{habit.name}</h1>
        </div>
      </div>
      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="pt-2">
          <HabitChart habit={habit} />
        </TabsContent>
        <TabsContent value="edit" className="pt-2">
          <HabitForm initial={habit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
