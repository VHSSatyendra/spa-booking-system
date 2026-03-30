import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import type { Booking, Therapist } from "../services/api";
import { BookingCard } from "./BookingCard";
import { TimeSidebar } from "./TimeSidebar";
import { getTherapistColor } from "../utils/bookingMapper";
import { parseTimeToMinutes } from "../utils/timeHelpers";

const GRID_START_HOUR = 9;
const GRID_END_HOUR = 23;
const PIXELS_PER_HOUR = 80;
const INTERVAL_MINUTES = 15;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const THERAPIST_COL_WIDTH = 120;

interface BookingGridProps {
  bookings: Booking[];
  therapists: Therapist[];
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (therapistId: number | null, time: string) => void;
  selectedBookingId?: number | null;
}

export const BookingGrid = memo(function BookingGrid({
  bookings,
  therapists,
  onBookingClick,
  onSlotClick,
  selectedBookingId,
}: BookingGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const totalHours = GRID_END_HOUR - GRID_START_HOUR + 1;
  const totalHeight = totalHours * PIXELS_PER_HOUR;

  const therapistMap = useMemo(() => {
    const m = new Map<number, Therapist>();
    therapists.forEach((t) => m.set(t.id, t));
    return m;
  }, [therapists]);

  const bookingsByTherapist = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = b.therapist_id != null ? String(b.therapist_id) : "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings]);

  const displayTherapists = useMemo(() => {
    return therapists.length > 0 ? therapists : [];
  }, [therapists]);

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, therapistId: number | null) => {
      if ((e.target as HTMLElement).closest("[data-booking]")) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const totalMinutes = (y / PIXELS_PER_MINUTE) + GRID_START_HOUR * 60;
      const snapped = Math.round(totalMinutes / INTERVAL_MINUTES) * INTERVAL_MINUTES;
      const h = Math.floor(snapped / 60);
      const m = snapped % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      onSlotClick(therapistId, time);
    },
    [onSlotClick]
  );

  const timeGridLines = useMemo(() => {
    const lines: { top: number; isHour: boolean }[] = [];
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
      lines.push({ top: (h - GRID_START_HOUR) * PIXELS_PER_HOUR, isHour: true });
      if (h < GRID_END_HOUR) {
        for (let i = 1; i < 60 / INTERVAL_MINUTES; i++) {
          lines.push({
            top: (h - GRID_START_HOUR) * PIXELS_PER_HOUR + i * INTERVAL_MINUTES * PIXELS_PER_MINUTE,
            isHour: false,
          });
        }
      }
    }
    return lines;
  }, []);

  const getBookingPosition = useCallback((booking: Booking) => {
    const startMins = parseTimeToMinutes(booking.start_time || "09:00");
    const gridStartMins = GRID_START_HOUR * 60;
    const top = (startMins - gridStartMins) * PIXELS_PER_MINUTE;
    const duration = booking.duration || (booking.services?.reduce((s, sv) => s + (sv.duration || 60), 0)) || 60;
    const height = duration * PIXELS_PER_MINUTE;
    return { top, height };
  }, []);

  return (
    <div className="flex flex-col h-full" data-testid="booking-grid">
      <div className="flex flex-1 overflow-auto">
        <div className="flex-shrink-0 sticky left-0 z-20 bg-white">
          <div style={{ height: "48px", width: "72px" }} className="border-r border-b border-gray-200 bg-white" />
          <TimeSidebar
            startHour={GRID_START_HOUR}
            endHour={GRID_END_HOUR}
            pixelsPerHour={PIXELS_PER_HOUR}
            intervalMinutes={INTERVAL_MINUTES}
          />
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex" style={{ minWidth: `${displayTherapists.length * THERAPIST_COL_WIDTH}px` }}>
            {displayTherapists.map((therapist) => {
              const color = getTherapistColor(therapist);
              const gender = (therapist.gender || "").toLowerCase();
              const genderLabel = gender === "female" || gender === "f" ? "Female" : gender === "male" || gender === "m" ? "Male" : "";

              return (
                <div
                  key={therapist.id}
                  className="flex-shrink-0 border-r border-gray-200"
                  style={{ width: `${THERAPIST_COL_WIDTH}px` }}
                >
                  <div
                    className="sticky top-0 z-10 bg-white border-b border-gray-200 flex flex-col items-center justify-center py-2 px-1"
                    style={{ height: "48px" }}
                    data-testid={`therapist-header-${therapist.id}`}
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: color,
                          fontSize: "9px",
                          flexShrink: 0,
                        }}
                      >
                        {therapist.id}
                      </div>
                      <span className="font-semibold text-xs truncate text-gray-800" style={{ fontSize: "11px" }}>
                        {therapist.name}
                      </span>
                    </div>
                    {genderLabel && (
                      <span className="text-xs" style={{ color, fontSize: "9px" }}>
                        {genderLabel}
                      </span>
                    )}
                  </div>

                  <div
                    className="relative cursor-pointer"
                    style={{ height: `${totalHeight}px` }}
                    onClick={(e) => handleGridClick(e, therapist.id)}
                  >
                    {timeGridLines.map((line, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0"
                        style={{
                          top: `${line.top}px`,
                          height: "1px",
                          backgroundColor: line.isHour ? "#E5E7EB" : "#F3F4F6",
                        }}
                      />
                    ))}

                    {(bookingsByTherapist.get(String(therapist.id)) || []).map((booking) => {
                      const { top, height } = getBookingPosition(booking);
                      const isSelected = booking.id === selectedBookingId;
                      return (
                        <div key={booking.id} data-booking="true">
                          <BookingCard
                            booking={booking}
                            therapist={therapist}
                            top={top}
                            height={height}
                            width="calc(100% - 4px)"
                            left="2px"
                            onClick={onBookingClick}
                          />
                          {isSelected && (
                            <div
                              className="absolute inset-0 rounded"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                width: "calc(100% - 4px)",
                                left: "2px",
                                boxShadow: "0 0 0 2px #2563EB",
                                pointerEvents: "none",
                                zIndex: 11,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {displayTherapists.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-20">
                No therapists found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
