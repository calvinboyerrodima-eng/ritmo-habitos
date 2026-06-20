"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, BarChart3, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Hoy", Icon: CalendarCheck2 },
  { href: "/habits", label: "Hábitos", Icon: Sparkles },
  { href: "/stats", label: "Stats", Icon: BarChart3 },
  { href: "/settings", label: "Ajustes", Icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur safe-bottom">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-4">
          {tabs.map(({ href, label, Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
