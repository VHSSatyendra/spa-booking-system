import type { Booking, Therapist } from "../services/api";

export type BookingStatus = "confirmed" | "checked_in" | "cancelled" | "completed" | "no_show" | "holding" | "unconfirmed" | "in_progress";

export function getBookingStatusColor(status: string): {
  bg: string;
  border: string;
  text: string;
  cardBg: string;
} {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  switch (s) {
    case "confirmed":
      return { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF", cardBg: "#EFF6FF" };
    case "checked_in":
    case "check_in":
    case "in_progress":
    case "check_in_in_progress":
      return { bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D", cardBg: "#FDF2F8" };
    case "cancelled":
    case "normal_cancellation":
      return { bg: "#F3F4F6", border: "#D1D5DB", text: "#6B7280", cardBg: "#F9FAFB" };
    case "completed":
    case "checkout":
    case "checked_out":
      return { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46", cardBg: "#ECFDF5" };
    case "no_show":
      return { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E", cardBg: "#FFFBEB" };
    case "holding":
    case "unconfirmed":
      return { bg: "#FEF9C3", border: "#FDE047", text: "#713F12", cardBg: "#FEFCE8" };
    default:
      return { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF", cardBg: "#EFF6FF" };
  }
}

export function getStatusDisplayLabel(status: string): string {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  switch (s) {
    case "confirmed": return "Confirmed";
    case "checked_in":
    case "check_in": return "Checked In";
    case "in_progress":
    case "check_in_in_progress": return "Check-in (In Progress)";
    case "cancelled":
    case "normal_cancellation": return "Cancelled (Normal Cancellation)";
    case "completed":
    case "checkout":
    case "checked_out": return "Completed";
    case "no_show": return "No Show";
    case "holding": return "Holding";
    case "unconfirmed": return "Unconfirmed";
    default: return status || "Unknown";
  }
}

export function canCheckIn(status: string): boolean {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  return s === "confirmed" || s === "unconfirmed" || s === "holding";
}

export function canCheckOut(status: string): boolean {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  return s === "checked_in" || s === "in_progress" || s === "check_in" || s === "check_in_in_progress";
}

export function canCancel(status: string): boolean {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  return s !== "cancelled" && s !== "normal_cancellation" && s !== "completed" && s !== "checkout" && s !== "checked_out";
}

export function getTherapistColor(therapist: Therapist | null | undefined): string {
  if (!therapist) return "#9CA3AF";
  const gender = (therapist.gender_label || therapist.gender || "").toLowerCase();
  if (gender === "female" || gender === "f") return "#EC4899";
  if (gender === "male" || gender === "m") return "#3B82F6";
  return "#8B5CF6";
}

export function groupBookingsByTherapist(
  bookings: Booking[],
  therapists: Therapist[]
): Map<number | null, Booking[]> {
  const map = new Map<number | null, Booking[]>();
  therapists.forEach((t) => map.set(t.id, []));
  map.set(null, []);

  for (const b of bookings) {
    const therapistId = b.therapist_id ?? null;
    if (map.has(therapistId)) {
      map.get(therapistId)!.push(b);
    } else {
      map.set(therapistId, [b]);
    }
  }
  return map;
}

export function detectOverlaps(bookings: Booking[]): Map<number, number> {
  const overlapCols = new Map<number, number>();
  const sorted = [...bookings].sort((a, b) => {
    const aStart = a.start_time || "";
    const bStart = b.start_time || "";
    return aStart.localeCompare(bStart);
  });

  for (let i = 0; i < sorted.length; i++) {
    let col = 0;
    const usedCols = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (isOverlapping(sorted[j], sorted[i])) {
        usedCols.add(overlapCols.get(sorted[j].id) || 0);
      }
    }
    while (usedCols.has(col)) col++;
    overlapCols.set(sorted[i].id, col);
  }
  return overlapCols;
}

function isOverlapping(a: Booking, b: Booking): boolean {
  if (!a.start_time || !b.start_time) return false;
  const aStart = parseTime(a.start_time);
  const aEnd = aStart + (a.duration || 60);
  const bStart = parseTime(b.start_time);
  const bEnd = bStart + (b.duration || 60);
  return aStart < bEnd && bStart < aEnd;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
