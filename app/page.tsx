"use client";
import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { TodayList } from "@/components/habits/today-list";
import { Button } from "@/components/ui/button";
import { extendSyncWindowIfNeeded } from "@/lib/calendar-sync";

export default function HoyPage() {
  const router = useRouter();
  const { settings } = useApp();

  React.useEffect(() => {
    if (!settings.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    if (settings.googleClientId) {
      extendSyncWindowIfNeeded().catch(() => {});
    }
  }, [settings.onboardingCompleted, settings.googleClientId, router]);

  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoy</p>
        <h1 className="text-2xl font-semibold capitalize">{today}</h1>
      </div>
      <TodayList />
      <div className="text-center">
        <Button asChild variant="link" size="sm">
          <Link href="/habits/new">+ Agregar hábito</Link>
        </Button>
      </div>
    </div>
  );
}
