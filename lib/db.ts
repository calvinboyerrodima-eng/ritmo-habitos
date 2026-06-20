import Dexie, { type Table } from "dexie";
import type { Completion, Habit, ScheduledEvent } from "./types";

export class RitmoDB extends Dexie {
  habits!: Table<Habit, string>;
  completions!: Table<Completion, string>;
  events!: Table<ScheduledEvent, string>;

  constructor() {
    super("ritmo");
    this.version(1).stores({
      habits: "id, name, category, createdAt, archivedAt",
      completions: "id, habitId, date, status, [habitId+date]",
      events: "id, habitId, date, googleEventId, status, [habitId+date]",
    });
  }
}

export const db = new RitmoDB();
