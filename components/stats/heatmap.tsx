"use client";
import * as React from "react";
import { addMonths, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { computeHeatmap, type HeatmapCell } from "@/lib/stats";
import { monthGrid, ymd, DAY_LABELS_ES_SHORT } from "@/lib/dates";

export function Heatmap() {
  const [month, setMonth] = React.useState(new Date());
  const [cells, setCells] = React.useState<HeatmapCell[]>([]);

  React.useEffect(() => {
    computeHeatmap(month).then(setCells);
  }, [month]);

  const cellMap = new Map(cells.map((c) => [c.date, c]));
  const grid = monthGrid(month);
  const monthLabel = format(month, "MMMM yyyy", { locale: es });

  return (
    <Card className="grid gap-3 p-4">
      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium capitalize">{monthLabel}</p>
        <Button size="icon" variant="ghost" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {[1, 2, 3, 4, 5, 6, 0].map((i) => (
          <div key={i}>{DAY_LABELS_ES_SHORT[i]}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const cell = cellMap.get(ymd(d));
          const inMonth = d.getMonth() === month.getMonth();
          const intensity = cell?.rate ?? 0;
          return (
            <div
              key={ymd(d)}
              className="aspect-square rounded"
              style={{
                backgroundColor:
                  cell && cell.scheduled > 0
                    ? `rgba(16, 185, 129, ${0.15 + intensity * 0.7})`
                    : "hsl(var(--muted))",
                opacity: inMonth ? 1 : 0.3,
              }}
              title={
                cell
                  ? `${cell.date}: ${cell.done}/${cell.scheduled}`
                  : ymd(d)
              }
            />
          );
        })}
      </div>
    </Card>
  );
}
