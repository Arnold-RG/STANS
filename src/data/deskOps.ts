export type ShiftId = "night" | "am" | "midday" | "pm";

export interface ShiftProfile {
  id: ShiftId;
  label: string;
  window: string;
  scale: number;
  note: string;
}

export const SHIFTS: Record<ShiftId, ShiftProfile> = {
  night: {
    id: "night",
    label: "NIGHT",
    window: "00–06",
    scale: 0.82,
    note: "Low volume. Closures still bind.",
  },
  am: {
    id: "am",
    label: "AM PEAK",
    window: "06–10",
    scale: 1.55,
    note: "Inbound surge. Arterials inflate.",
  },
  midday: {
    id: "midday",
    label: "MIDDAY",
    window: "10–16",
    scale: 1.12,
    note: "Steady flow. Commercial mix.",
  },
  pm: {
    id: "pm",
    label: "PM PEAK",
    window: "16–22",
    scale: 1.72,
    note: "Outbound surge. Highest delay.",
  },
};

export const SHIFT_ORDER: ShiftId[] = ["night", "am", "midday", "pm"];

export function inferShift(date = new Date()): ShiftId {
  const hour = date.getHours();
  if (hour < 6) return "night";
  if (hour < 10) return "am";
  if (hour < 16) return "midday";
  if (hour < 22) return "pm";
  return "night";
}

export type LogKind = "info" | "route" | "incident" | "board";

export interface DispatchEntry {
  id: string;
  at: string;
  kind: LogKind;
  text: string;
}

export interface SavedTrip {
  id: string;
  liveId: string;
  destId: string;
  viaId?: string;
  label: string;
  minutes?: number;
  savedAt: string;
}

export const TRIPS_STORAGE_KEY = "stans.savedTrips.v1";
export const OPERATOR_STORAGE_KEY = "stans.operator.v1";
export const NOTES_STORAGE_KEY = "stans.dutyNotes.v1";
export const UNITS_STORAGE_KEY = "stans.units.v1";

export interface DeskOperator {
  callsign: string;
  post: string;
}

export type UnitStatus = "standby" | "enroute" | "onscene";

export interface FieldUnit {
  id: string;
  callsign: string;
  at: string;
  status: UnitStatus;
}

export function stampNow(date = new Date()): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function newLog(kind: LogKind, text: string): DispatchEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: stampNow(),
    kind,
    text,
  };
}
