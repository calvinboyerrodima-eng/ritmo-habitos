"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CalendarCheck2, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { requestToken } from "@/lib/google-calendar";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings, setSettings } = useApp();
  const [step, setStep] = React.useState(0);
  const [clientId, setClientId] = React.useState(settings.googleClientId);

  async function tryConnect() {
    if (!clientId.trim()) {
      // permite continuar sin conectar (lo configura después)
      setStep(1);
      return;
    }
    setSettings({ googleClientId: clientId.trim() });
    try {
      await requestToken({ clientId: clientId.trim(), prompt: "consent" });
      toast({ title: "Conectado" });
      setStep(1);
    } catch (e) {
      toast({ title: "No se pudo conectar", description: (e as Error).message });
    }
  }

  function finish() {
    setSettings({ onboardingCompleted: true });
    router.replace("/");
  }

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Ritmo · Bienvenida
        </div>

        {step === 0 && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold">1. Conectá tu Google Calendar</h2>
                <p className="text-sm text-muted-foreground">
                  Ritmo agenda cada hábito como evento con recordatorio. Pegá tu OAuth
                  Client ID (Web app). Si no lo tenés a mano, podés saltearlo y
                  configurarlo después en Ajustes.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>OAuth Client ID</Label>
                <Input
                  placeholder="123-abc.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={tryConnect} className="flex-1">
                  <CalendarCheck2 className="h-4 w-4" /> Conectar
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Después
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold">2. Tu primer hábito</h2>
                <p className="text-sm text-muted-foreground">
                  Empezá con uno chiquito. Después lo editás.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href="/habits/new">
                    Crear hábito <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Saltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold">3. Instalala como app</h2>
                <p className="text-sm text-muted-foreground">
                  En el menú del navegador buscá &ldquo;Instalar app&rdquo; (o tocá Compartir &rarr;
                  Agregar a pantalla principal en iOS). Te queda como app nativa,
                  offline incluso.
                </p>
              </div>
              <Button onClick={finish} className="w-full">
                <Download className="h-4 w-4" /> Listo, arrancar
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i <= step ? "bg-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
