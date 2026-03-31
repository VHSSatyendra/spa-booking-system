import React, { useMemo, useState } from "react";
import { useTherapists } from "../hooks/useTherapists";
import { useBookings } from "../hooks/useBookings";
import BookingGrid from "../components/BookingGrid";
import TherapistList from "../components/TherapistList";
import Searchbar from "../components/Searchbar";
import { useDebounce } from "../hooks/useDebounce";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState("2026-03-30 10:00:00");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [genderFilter, setGenderFilter] = useState("all");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: therapists = [], isLoading: therapistsLoading } =
    useTherapists(selectedDate);

  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();

  // ✅ FINAL FILTER LOGIC (SEARCH + GENDER + SELECTED)
  const filteredTherapists = useMemo(() => {
    const search = (debouncedSearch || "").toLowerCase();
    const gender = genderFilter.toLowerCase();

    return therapists.filter((t) => {
      const matchesSearch = t.alias?.toLowerCase().includes(search);

      const matchesGender =
        gender === "all" || t.gender?.toLowerCase() === gender;

      const matchesSelected =
        selectedIds.length === 0 || selectedIds.includes(t.id);

      return matchesSearch && matchesGender && matchesSelected;
    });
  }, [therapists, debouncedSearch, genderFilter, selectedIds]);

  return (
    <div>
      <Searchbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        therapists={therapists}
        onApplyFilter={({ selectedIds, gender }) => {
          setSelectedIds(selectedIds);
          setGenderFilter(gender);
        }}
      />

      <div className="px-5 py-4 w-full flex flex-row items-center">
        <h6 className="font-bold pr-10">Time</h6>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex flex-row gap-2">
            <TherapistList
              therapists={filteredTherapists}
              searchParam={searchQuery}
            />
          </div>
        </div>
      </div>

      <div className="px-4">
        {therapistsLoading && <p>Loading therapists...</p>}
        {bookingsLoading && <p>Loading bookings...</p>}

        <BookingGrid therapists={filteredTherapists} date={selectedDate} />
      </div>
    </div>
  );
};

export default Home;
