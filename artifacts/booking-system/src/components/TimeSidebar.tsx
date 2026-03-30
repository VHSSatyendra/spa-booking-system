import { memo } from "react";
import { formatTime } from "../utils/timeHelpers";

interface TimeSidebarProps {
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
  intervalMinutes: number;
}

export const TimeSidebar = memo(function TimeSidebar({
  startHour,
  endHour,
  pixelsPerHour,
  intervalMinutes,
}: TimeSidebarProps) {
  const slots: { time: string; top: number; isHour: boolean }[] = [];
  const intervals = 60 / intervalMinutes;

  for (let h = startHour; h <= endHour; h++) {
    const top = (h - startHour) * pixelsPerHour;
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, top, isHour: true });
    if (h < endHour && intervalMinutes < 60) {
      for (let i = 1; i < intervals; i++) {
        const mins = i * intervalMinutes;
        const subTop = top + (mins / 60) * pixelsPerHour;
        slots.push({
          time: `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
          top: subTop,
          isHour: false,
        });
      }
    }
  }

  return (
    <div
      className="relative bg-white border-r border-gray-200 flex-shrink-0"
      style={{ width: "72px", height: `${(endHour - startHour + 1) * pixelsPerHour}px` }}
      data-testid="time-sidebar"
    >
      {slots.map((slot) => (
        <div
          key={slot.time}
          className="absolute left-0 right-0 flex items-start justify-end pr-2"
          style={{ top: `${slot.top}px`, height: `${(intervalMinutes / 60) * pixelsPerHour}px` }}
        >
          {slot.isHour ? (
            <span className="text-xs font-medium text-gray-600 leading-none" style={{ fontSize: "11px" }}>
              {formatTime(slot.time)}
            </span>
          ) : (
            <span className="text-xs text-gray-400 leading-none" style={{ fontSize: "9px" }}>
              {slot.time.split(":")[1]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});
