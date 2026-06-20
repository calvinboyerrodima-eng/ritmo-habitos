"use client";
import { cn } from "@/lib/utils";

const EMOJIS = ["🌅","💪","📚","🧘","🏃","💧","🥗","🛌","✍️","🎯","🎨","🧹","🌱","🧠","☕","🎵","🚴","🧴","💊","📞"];
const COLORS = [
  "#0EA5E9", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

interface Props {
  emoji: string;
  color: string;
  onChangeEmoji: (e: string) => void;
  onChangeColor: (c: string) => void;
}

export function EmojiColorPicker({ emoji, color, onChangeEmoji, onChangeColor }: Props) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Emoji</p>
        <div className="grid grid-cols-10 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChangeEmoji(e)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border text-lg transition",
                e === emoji ? "border-primary bg-accent" : "border-transparent hover:bg-accent",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChangeColor(c)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition",
                c === color ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
