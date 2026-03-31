export default function SlotList({ slots, selectedSlot, setSelectedSlot }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {slots.length > 0 ? (
        slots.map((slot) => (
          <button
            key={slot}
            onClick={() => setSelectedSlot(slot)}
            className={`p-3 rounded-lg border transition ${
              selectedSlot === slot
                ? "bg-green-500 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {slot}
          </button>
        ))
      ) : (
        <p>No slots available</p>
      )}
    </div>
  );
}
