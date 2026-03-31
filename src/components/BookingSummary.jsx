export default function BookingSummary({
  selectedTherapist,
  date,
  selectedSlot,
}) {
  if (!selectedSlot) return null;

  return (
    <div className="mt-4 p-3 border rounded bg-gray-100">
      <p>
        <strong>Therapist:</strong> {selectedTherapist}
      </p>
      <p>
        <strong>Date:</strong> {date}
      </p>
      <p>
        <strong>Time:</strong> {selectedSlot}
      </p>
    </div>
  );
}
