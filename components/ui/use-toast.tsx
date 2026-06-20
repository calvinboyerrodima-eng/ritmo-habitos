"use client";
import * as React from "react";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive";
};

type Ctx = {
  toasts: ToastItem[];
  toast: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const Context = React.createContext<Ctx | null>(null);

export function ToastStateProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    const dur = t.duration ?? 3500;
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), dur);
  }, []);
  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);
  return <Context.Provider value={{ toasts, toast, dismiss }}>{children}</Context.Provider>;
}

export function useToast() {
  const ctx = React.useContext(Context);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastStateProvider");
  return ctx;
}
