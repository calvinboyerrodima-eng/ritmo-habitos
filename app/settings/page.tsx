"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { clearToken, requestToken } from "@/lib/google-calendar";
import { resyncAll } from "@/lib/calendar-sync";
import { CALENDAR_SCOPE } from "@/lib/google-config";

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const { toast } = useToast();
  const [clientIdDraft, setClientIdDraft] = React.useState(settings.googleClientId);
  const [syncing, setSyncing] = React.useState(false);

  async function connect() {
    if (!clientIdDraft.trim()) {
      toast({ title: "Pegá un Client ID válido" });
      return;
    }
    setSettings({ googleClientId: clientIdDraft.trim() });
    try {
      await requestToken({ clientId: clientIdDraft.trim(), prompt: "consent" });
      toast({ title: "Google conectado" });
    } catch (e) {
      toast({ title: "Falló la conexión", description: (e as Error).message });
    }
  }

  function disconnect() {
    clearToken();
    setSettings({ calendarId: null });
    toast({ title: "Token borrado de esta sesión" });
  }

  async function doResync() {
    setSyncing(true);
    try {
      const r = await resyncAll();
      toast({
        title: "Resincronizado",
        description: `${r.events} eventos creados en ${r.habits} hábitos.`,
      });
    } catch (e) {
      toast({ title: "Error al sincronizar", description: (e as Error).message });
    }
    setSyncing(false);
  }

  async function doExport() {
    const habits = await db.habits.toArray();
    const completions = await db.completions.toArray();
    const events = await db.events.toArray();
    const data = { version: 1, exportedAt: new Date().toISOString(), habits, completions, events };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ritmo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport(file: File) {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.habits)) throw new Error("Formato inválido");
      await db.transaction("rw", db.habits, db.completions, db.events, async () => {
        await db.habits.clear();
        await db.completions.clear();
        await db.events.clear();
        if (data.habits.length) await db.habits.bulkPut(data.habits);
        if (data.completions?.length) await db.completions.bulkPut(data.completions);
        if (data.events?.length) await db.events.bulkPut(data.events);
      });
      toast({ title: "Importado correctamente" });
    } catch (e) {
      toast({ title: "Falló el import", description: (e as Error).message });
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Ajustes</p>
        <h1 className="text-2xl font-semibold">Configuración</h1>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <Label>Google Calendar</Label>
          <p className="text-xs text-muted-foreground">
            Pegá el Client ID OAuth tipo &ldquo;Web application&rdquo; con scope{" "}
            <code className="font-mono text-[10px]">{CALENDAR_SCOPE}</code>.
          </p>
          <Input
            placeholder="123-abc.apps.googleusercontent.com"
            value={clientIdDraft}
            onChange={(e) => setClientIdDraft(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={connect}>Conectar</Button>
            <Button variant="outline" onClick={disconnect}>
              Desconectar sesión
            </Button>
            <Button
              variant="secondary"
              onClick={doResync}
              disabled={!settings.googleClientId || syncing}
            >
              {syncing ? "Sincronizando…" : "Resincronizar todo"}
            </Button>
          </div>
          {settings.calendarId && (
            <p className="text-xs text-muted-foreground">
              Calendario dedicado: <span className="font-mono">{settings.calendarName}</span>
            </p>
          )}
          {settings.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Última sync: {new Date(settings.lastSyncAt).toLocaleString("es-AR")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <Label>Tema</Label>
          <div className="flex gap-2">
            {(["system", "light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSettings({ themeMode: m })}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${
                  settings.themeMode === m ? "border-primary bg-accent" : "hover:bg-accent"
                }`}
              >
                {m === "system" ? "Auto" : m === "light" ? "Claro" : "Oscuro"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <Label>Datos</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={doExport}>
              Exportar JSON
            </Button>
            <label className="inline-flex">
              <Button variant="outline" asChild>
                <span>Importar JSON</span>
              </Button>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) doImport(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Ritmo · datos en este navegador, eventos en tu Calendar.
      </p>
    </div>
  );
}
