"use client";
import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { ToastStateProvider } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import { PWARegister } from "./pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastStateProvider>
      <ThemeProvider>
        {children}
        <Toaster />
        <PWARegister />
      </ThemeProvider>
    </ToastStateProvider>
  );
}
