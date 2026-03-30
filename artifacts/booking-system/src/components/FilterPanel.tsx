import { useState } from "react";
import { X } from "lucide-react";

interface FilterPanelProps {
  onClose: () => void;
}

const BOOKING_STATUSES = [
  { key: "confirmed", label: "Confirmed", color: "#93C5FD" },
  { key: "unconfirmed", label: "Unconfirmed", color: "#FCD34D" },
  { key: "checked_in", label: "Checked In", color: "#F9A8D4" },
  { key: "completed", label: "Completed", color: "#6EE7B7" },
  { key: "cancelled", label: "Cancelled", color: "#6B7280" },
  { key: "no_show", label: "No Show", color: "#6B7280" },
  { key: "holding", label: "Holding", color: "#FDE047" },
  { key: "in_progress", label: "Check-in (In Progress)", color: "#F9A8D4" },
];

export function FilterPanel({ onClose }: FilterPanelProps) {
  const [groupBy, setGroupBy] = useState<"all" | "male" | "female">("all");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(BOOKING_STATUSES.filter((s) => s.key !== "cancelled" && s.key !== "no_show").map((s) => s.key))
  );
  const [resources, setResources] = useState({ rooms: false, sofa: false, monkey_chair: false });

  const toggleStatus = (key: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className="fixed right-0 top-0 bottom-0 bg-white shadow-2xl z-50 overflow-y-auto"
      style={{ width: "320px", borderLeft: "1px solid #E5E7EB" }}
      data-testid="filter-panel"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">Filter</h2>
        <button onClick={onClose}>
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-800 mb-2">Show by group (Person who is on duty)</h3>
          {["All Therapist", "Male", "Female"].map((opt, i) => (
            <div key={opt} className="flex items-center justify-between py-1.5 pl-2">
              <span className="text-sm text-gray-700">{opt}</span>
              {i === 0 && (
                <div className="w-4 h-4 rounded-full bg-gray-800" />
              )}
            </div>
          ))}
        </div>

        <hr className="border-gray-200" />

        <div>
          <h3 className="text-xs font-semibold text-gray-500 mb-2">Resources</h3>
          {["Rooms", "Sofa", "Monkey Chair"].map((res) => (
            <div key={res} className="py-1.5 pl-2">
              <span className="text-sm text-gray-700">{res}</span>
            </div>
          ))}
        </div>

        <hr className="border-gray-200" />

        <div>
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Booking Status</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {BOOKING_STATUSES.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0"
                  style={{
                    backgroundColor: selectedStatuses.has(s.key) ? "#1F1E1D" : "white",
                    borderColor: selectedStatuses.has(s.key) ? "#1F1E1D" : "#D1D5DB",
                  }}
                  onClick={() => toggleStatus(s.key)}
                >
                  {selectedStatuses.has(s.key) && (
                    <span className="text-white" style={{ fontSize: "10px" }}>✓</span>
                  )}
                </div>
                <span className="text-xs text-gray-700 leading-tight">{s.label}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-900">Select Therapist</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-700">Select All</span>
              <div
                className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: "#1F1E1D", borderColor: "#1F1E1D" }}
              >
                <span className="text-white" style={{ fontSize: "10px" }}>✓</span>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search by therapist"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none mb-2"
          />
        </div>

        <button
          className="text-xs font-medium w-full text-left"
          style={{ color: "#D97706" }}
          onClick={() => {
            setSelectedStatuses(new Set(BOOKING_STATUSES.filter((s) => s.key !== "cancelled" && s.key !== "no_show").map((s) => s.key)));
          }}
        >
          Clear Filter (Return to Default)
        </button>
      </div>
    </div>
  );
}
