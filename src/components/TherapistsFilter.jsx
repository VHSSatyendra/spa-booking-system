import React, { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const TherapistFilter = ({ therapists, onApply }) => {
  const [genderFilter, setGenderFilter] = useState("all"); // 'All', 'Male', 'Female'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // 1. DYNAMIC FILTERING LOGIC
  // We use useMemo for performance with 100+ items
  const filteredTherapists = useMemo(() => {
    return therapists.filter((t) => {
      const matchesGender =
        genderFilter === "all" || t.gender?.toLowerCase() === genderFilter;

      const matchesSearch = t.alias
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());

      return matchesGender && matchesSearch;
    });
  }, [therapists, genderFilter, debouncedSearch]);

  // console.log("Filtered Therapists:", filteredTherapists); // Debugging log

  // 2. TOGGLE INDIVIDUAL
  const toggleTherapist = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 3. SELECT ALL (Based on current filtered results)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredTherapists.map((t) => t.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="absolute top-33 right-106 w-80 bg-white shadow-xl border border-gray-200 rounded-md z-50 flex flex-col max-h-[600px]">
      {/* GENDER SECTION */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Gender
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "All Therapists", value: "all" },
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ].map((gender) => (
            <label
              key={gender.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="gender"
                checked={genderFilter === gender.value}
                onChange={() => setGenderFilter(gender.value)}
                className="w-4 h-4 accent-[#4A3728] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-black">
                {gender.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* SELECT ALL & SEARCH SECTION */}
      <div className="p-4 space-y-3 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase">
            Select Therapist
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-gray-600">
              Select All
            </span>
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={
                filteredTherapists.length > 0 &&
                selectedIds.length === filteredTherapists.length
              }
              className="w-4 h-4 accent-[#4A3728]"
            />
          </label>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by therapist name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* THERAPISTS LIST SECTION */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-2">
        {filteredTherapists.length > 0 ? (
          filteredTherapists.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTherapist(t.id)}
              className={`flex items-center justify-between px-3 py-2.5 border rounded cursor-pointer transition-all ${
                selectedIds.includes(t.id)
                  ? "border-[#4A3728] bg-orange-50/30"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${t.gender === "male" ? "bg-blue-400" : "bg-pink-400"}`}
                />
                <span
                  className={`text-sm ${selectedIds.includes(t.id) ? "font-bold text-[#4A3728]" : "text-gray-600"}`}
                >
                  {t.alias}
                </span>
              </div>
              {selectedIds.includes(t.id) && (
                <Check size={14} className="text-[#4A3728]" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs italic">
            No therapists found matching your filters.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t bg-white flex flex-col gap-2">
        <button
          onClick={() =>
            onApply({
              selectedIds,
              gender: genderFilter,
            })
          }
          className="w-full bg-[#4A3728] text-white py-2 rounded text-sm font-bold"
        >
          Apply Filter ({selectedIds.length})
        </button>
        <button
          onClick={() => {
            setSelectedIds([]);
            setGenderFilter("all");
            setSearchQuery("");
          }}
          className="text-center text-xs text-orange-800 font-bold hover:underline"
        >
          Clear Filter (Return to Default)
        </button>
      </div>
    </div>
  );
};

export default TherapistFilter;
