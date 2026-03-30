import { memo } from "react";
import type { Booking } from "../services/api";
import { getBookingStatusColor, getTherapistColor } from "../utils/bookingMapper";
import type { Therapist } from "../services/api";

interface BookingCardProps {
  booking: Booking;
  therapist?: Therapist | null;
  top: number;
  height: number;
  width?: string;
  left?: string;
  onClick?: (booking: Booking) => void;
}

function getServiceIcons(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "C";
  return "C";
}

export const BookingCard = memo(function BookingCard({
  booking,
  therapist,
  top,
  height,
  width = "100%",
  left = "0",
  onClick,
}: BookingCardProps) {
  const colors = getBookingStatusColor(booking.status || "confirmed");
  const therapistColor = getTherapistColor(therapist);
  const serviceName =
    booking.services?.[0]?.service_name ||
    `${booking.duration || 60} Min Service`;
  const totalDuration = booking.services
    ? booking.services.reduce((sum, s) => sum + (s.duration || 0), 0)
    : booking.duration || 60;

  const isCancelled = (booking.status || "").toLowerCase().includes("cancel");
  const isCheckedIn =
    (booking.status || "").toLowerCase().includes("checked_in") ||
    (booking.status || "").toLowerCase().includes("in_progress") ||
    (booking.status || "").toLowerCase().includes("check_in");

  return (
    <div
      data-testid={`booking-card-${booking.id}`}
      onClick={() => onClick?.(booking)}
      className="absolute overflow-hidden rounded cursor-pointer select-none transition-opacity hover:opacity-90"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 32)}px`,
        width,
        left,
        right: "2px",
        backgroundColor: colors.cardBg,
        borderLeft: `3px solid ${isCancelled ? "#9CA3AF" : isCheckedIn ? "#F472B6" : "#60A5FA"}`,
        border: `1px solid ${colors.border}`,
        borderLeftWidth: "3px",
        borderLeftColor: isCancelled ? "#9CA3AF" : isCheckedIn ? "#F472B6" : "#60A5FA",
        zIndex: 10,
      }}
    >
      <div className="p-1 h-full flex flex-col overflow-hidden">
        {height >= 40 && (
          <div className="font-semibold text-xs leading-tight truncate" style={{ color: colors.text, fontSize: "11px" }}>
            {totalDuration} Min {serviceName}
          </div>
        )}
        {height >= 56 && (
          <>
            <div className="text-xs truncate mt-0.5" style={{ color: colors.text, fontSize: "10px", opacity: 0.85 }}>
              {booking.client_phone || ""}
            </div>
            <div className="text-xs truncate" style={{ color: colors.text, fontSize: "10px", opacity: 0.85 }}>
              {booking.client_name || ""}
            </div>
          </>
        )}
        {height >= 80 && (
          <div className="flex items-center gap-0.5 mt-auto pt-1 flex-wrap">
            <ServiceIcon letter="C" color={therapistColor} />
            <ServiceIcon letter="S" color="#10B981" />
            <ServiceIcon letter="R" color="#6366F1" />
            {booking.notes && <ServiceIcon letter="N" color="#F59E0B" />}
          </div>
        )}
      </div>
    </div>
  );
});

function ServiceIcon({ letter, color }: { letter: string; color: string }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        width: "14px",
        height: "14px",
        backgroundColor: color,
        fontSize: "8px",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}
