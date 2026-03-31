import { useState } from "react";
import calendarIcon from "../assets/calenderIcon.png";
import BookingDrawer from "./BookingDrawer";
import TherapistFilter from "./TherapistsFilter";

const Searchbar = ({
  searchQuery,
  setSearchQuery,
  therapists,
  onApplyFilter,
}) => {
  const [displayTime, setDisplayTime] = useState("15 Min");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const handleCreateNew = () => {
    setSelectedBooking(null);
    setIsDrawerOpen(true);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-gray-900">Liat Towers</h1>
      </div>

      <div className="flex gap-4">
        {/* SEARCH */}
        <div className="w-[25rem] flex items-center border border-gray-200 rounded-sm">
          <input
            type="text"
            placeholder="Search therapist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm focus:outline-none"
          />
        </div>

        {/* FILTER BUTTON */}
        <button
          className="px-4 py-2 border border-gray-200 rounded-sm text-sm"
          onClick={() => setShowFilter(!showFilter)}
        >
          Filter
        </button>

        <button
          className="px-4 py-2 border border-gray-200 rounded-sm text-sm"
          onClick={handleCreateNew}
        >
          Create Booking
        </button>

        {/* DATE */}
        <div className="flex items-center bg-gray-100 px-3 py-2">
          <button onClick={goToToday}>Today</button>
          <div className="flex items-center">
            <button
              onClick={goToPreviousDay}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {formatDate(selectedDate)}
            </span>

            <button
              onClick={goToNextDay}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="border-l-2 pl-3 border-gray-300">
              <img src={calendarIcon} alt="Calendar" />
            </div>
          </div>
        </div>
      </div>

      <BookingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={selectedBooking}
      />

      {/* ✅ FILTER CONNECTED */}
      {showFilter && (
        <TherapistFilter
          therapists={therapists}
          onApply={(data) => {
            onApplyFilter(data);
            setShowFilter(false);
          }}
        />
      )}
    </div>
  );
};

export default Searchbar;
