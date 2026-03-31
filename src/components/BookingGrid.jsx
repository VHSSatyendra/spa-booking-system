import React, { useMemo } from "react";
import { useBookings } from "../hooks/useBookings";

// CONFIG
const START_HOUR = 9;
const END_HOUR = 23;
const ROW_HEIGHT = 40;
const COLUMN_WIDTH = 125;

const BookingGrid = ({ date, therapists = [] }) => {
  // ✅ SAFE FETCH (only runs if date exists)
  const { data, isLoading } = useBookings(date, {
    enabled: !!date,
  });

  console.log("BOOKINGS API:", data);

  // ✅ SAFE EXTRACTION (no crash)

  const rawBookings = Array.isArray(data) ? data : [];

  // 🔥 TRANSFORM BOOKINGS
  const appointments = useMemo(() => {
    if (!Array.isArray(rawBookings)) return [];

    const result = [];

    rawBookings.forEach((booking) => {
      const bookingItems = booking?.booking_item || {};

      Object.values(bookingItems).forEach((itemsArray) => {
        if (!Array.isArray(itemsArray)) return;

        itemsArray.forEach((item) => {
          result.push({
            id: item?.id,
            columnId: item?.therapist_id,
            startTime: item?.start_time?.slice(0, 5) || "00:00",
            duration: item?.duration || 60,
            title: item?.service || "Service",
            client: item?.customer_name || "Client",
            phone: booking?.mobile_number || "",
            status: booking?.status || "Booked",
          });
        });
      });
    });

    return result;
  }, [rawBookings]);

  // 🕒 TIME SLOTS
  const timeSlots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    ["00", "15", "30", "45"].forEach((min) => {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:${min}`);
    });
  }

  // ✅ SAFE THERAPISTS
  const columnIds = Array.isArray(therapists)
    ? therapists.map((t) => t.id)
    : [];

  // 🎯 POSITION LOGIC
  const getRowOffset = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = (h - START_HOUR) * 60 + m;
    return (totalMinutes / 15) * ROW_HEIGHT;
  };

  // 🎨 STATUS COLOR
  const getColor = (status) => {
    switch (status) {
      case "No-show":
        return "bg-gray-200 border-gray-400";
      case "Completed":
        return "bg-green-100 border-green-400";
      default:
        return "bg-[#C5E8EF] border-[#8AC9D5]";
    }
  };

  // ⛔ LOADING
  if (isLoading) {
    return <p>Loading bookings...</p>;
  }

  return (
    <div className="flex bg-white overflow-x-auto border-t border-gray-200">
      {/* TIME SIDEBAR */}
      <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200 sticky left-0 z-20">
        {timeSlots.map((time, i) => (
          <div
            key={time}
            style={{ height: `${ROW_HEIGHT}px` }}
            className={`flex items-center justify-end pr-2 border-b border-gray-100 ${
              i % 4 === 0 ? "bg-gray-100" : ""
            }`}
          >
            {i % 4 === 0 && (
              <span className="text-[11px] font-bold text-gray-600">
                {parseInt(time.split(":")[0]) >= 12
                  ? `${parseInt(time.split(":")[0]) - 12 || 12}.00 PM`
                  : `${time.split(":")[0]}.00 AM`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="flex relative">
        {columnIds.map((id) => (
          <div
            key={id}
            style={{ width: `${COLUMN_WIDTH}px` }}
            className="relative border-r border-gray-200"
          >
            {/* GRID LINES */}
            {timeSlots.map((time) => (
              <div
                key={time}
                style={{ height: `${ROW_HEIGHT}px` }}
                className="border-b border-gray-50"
              />
            ))}

            {/* BOOKINGS */}
            {appointments
              .filter((app) => app.columnId === id)
              .map((app) => (
                <div
                  key={app.id}
                  className={`absolute left-1 right-1 p-2 border-l-4 rounded shadow-sm z-10 cursor-pointer ${getColor(
                    app.status,
                  )}`}
                  style={{
                    top: `${getRowOffset(app.startTime)}px`,
                    height: `${(app.duration / 15) * ROW_HEIGHT}px`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase">{app.title}</p>
                  <p className="text-[10px]">{app.phone}</p>
                  <p className="text-[10px] opacity-80">{app.client}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingGrid;
