"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { EmojiColorPicker } from "./emoji-color-picker";
import { EMPTY_SCHEDULE, WeeklyScheduleGrid } from "./weekly-schedule-grid";
import { RecurrencePresets } from "./recurrence-presets";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { syncHabitEvents, deleteHabitEvents } from "@/lib/calendar-sync";
import type { Habit } from "@/lib/types";
import { useApp } from "@/lib/store";

const CATEGORIES = ["Salud", "Mental", "Trabajo", "Aprendizaje", "Hogar", "Social", "Otros"];
const REMINDERS = [5, 10, 15, 30, 60, 120];

interface Props {
  initial?: Habit;
}

export function HabitForm({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const clientId = useApp((s) => s.settings.googleClientId);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [emoji, setEmoji] = React.useState(initial?.emoji ?? "🎯");
  const [color, setColor] = React.useState(initial?.color ?? "#0EA5E9");
  const [category, setCategory] = React.useState(initial?.category ?? CATEGORIES[0]);
  const [isQuant, setIsQuant] = React.useState(initial?.type === "quant");
  const [target, setTarget] = React.useState<number>(initial?.target ?? 1);
  const [unit, setUnit] = React.useState(initial?.unit ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [reminder, setReminder] = React.useState<number>(initial?.reminderMinutes ?? 10);
  const [customReminder, setCustomReminder] = React.useState<string>("");
  const [schedule, setSchedule] = React.useState(initial?.schedule ?? EMPTY_SCHEDULE);
  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    if (!name.trim()) {
      toast({ title: "Falta el nombre del hábito" });
      return;
    }
    const hasAnySlot = Object.values(schedule).some((s) => !!s.startTime);
    if (!hasAnySlot) {
      toast({ title: "Configurá al menos un día con horario" });
      return;
    }
    setSaving(true);
    const finalReminder = customReminder ? Number(customReminder) || reminder : reminder;
    const habit: Habit = {
      id: initial?.id ?? uuid(),
      name: name.trim(),
      emoji,
      color,
      category,
      type: isQuant ? "quant" : "bool",
      target: isQuant ? target : undefined,
      unit: isQuant ? unit || "u" : undefined,
      notes: notes.trim() || undefined,
      reminderMinutes: finalReminder,
      schedule,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    await db.habits.put(habit);
    try {
      if (clientId) {
        await syncHabitEvents(habit);
        toast({ title: "Hábito guardado y agendado en Calendar" });
      } else {
        toast({
          title: "Hábito guardado",
          description: "Configurá Google en Ajustes para sincronizar a Calendar.",
        });
      }
    } catch (e) {
      toast({
        title: "Guardado, pero falló la sync",
        description: (e as Error).message,
      });
    }
    setSaving(false);
    router.push("/habits");
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm("¿Eliminar este hábito y todos sus eventos futuros?")) return;
    try {
      if (clientId) await deleteHabitEvents(initial.id);
    } catch {
      /* siga */
    }
    await db.habits.delete(initial.id);
    await db.events.where("habitId").equals(initial.id).delete();
    await db.completions.where("habitId").equals(initial.id).delete();
    toast({ title: "Hábito eliminado" });
    router.push("/habits");
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-4 p-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Meditar 10 minutos"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <EmojiColorPicker
            emoji={emoji}
            color={color}
            onChangeEmoji={setEmoji}
            onChangeColor={setColor}
          />
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    category === c ? "border-primary bg-accent" : "hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4">
          <Tabs value={isQuant ? "quant" : "bool"} onValueChange={(v) => setIsQuant(v === "quant")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bool">Sí / No</TabsTrigger>
              <TabsTrigger value="quant">Con meta</TabsTrigger>
            </TabsList>
            <TabsContent value="bool" className="text-sm text-muted-foreground">
              Marcás como hecho cuando lo cumplís.
            </TabsContent>
            <TabsContent value="quant" className="grid grid-cols-2 gap-2 pt-2">
              <div className="grid gap-1">
                <Label htmlFor="target">Meta diaria</Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value) || 1)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="unit">Unidad</Label>
                <Input
                  id="unit"
                  placeholder="vasos, km, páginas…"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Detalles, motivación, recordatorios…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <Label>Repetición</Label>
          <p className="text-xs text-muted-foreground">
            Elegí un preset o personalizá día por día abajo. Los hábitos se
            re-agendan automáticamente cada 30 días.
          </p>
          <RecurrencePresets schedule={schedule} onApply={setSchedule} />
          <WeeklyScheduleGrid value={schedule} onChange={setSchedule} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <Label>Recordatorio</Label>
          <div className="flex flex-wrap gap-2">
            {REMINDERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReminder(r);
                  setCustomReminder("");
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  reminder === r && !customReminder
                    ? "border-primary bg-accent"
                    : "hover:bg-accent"
                }`}
              >
                {r >= 60 ? `${r / 60} h` : `${r} min`} antes
              </button>
            ))}
            <Input
              type="number"
              min={1}
              placeholder="Custom (min)"
              value={customReminder}
              onChange={(e) => setCustomReminder(e.target.value)}
              className="h-7 w-32"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear hábito"}
        </Button>
        {initial && (
          <Button variant="destructive" onClick={onDelete} disabled={saving}>
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
