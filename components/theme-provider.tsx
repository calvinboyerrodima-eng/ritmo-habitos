"use client";
import * as React from "react";
import { useApp } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useApp((s) => s.settings.themeMode);

  React.useEffect(() => {
    const apply = (m: "light" | "dark") => {
      document.documentElement.classList.toggle("dark", m === "dark");
    };
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(mode);
  }, [mode]);

  return <>{children}</>;
}
