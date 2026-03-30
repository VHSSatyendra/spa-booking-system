import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, Info, ChevronDown } from "lucide-react";
import type { Booking, Therapist, Service, Room, Client } from "../services/api";
import { getStatusDisplayLabel, canCheckIn, canCheckOut, canCancel, getTherapistColor } from "../utils/bookingMapper";
import { formatTime, formatDate } from "../utils/timeHelpers";
import { useClientSearch } from "../hooks/useResources";
import { useToast } from "@/hooks/use-toast";

interface BookingDrawerProps {
  mode: "view" | "edit" | "create";
  booking?: Booking | null;
  therapists: Therapist[];
  services: Service[];
  rooms: Room[];
  outletId: number;
  outletName?: string;
  defaultDate?: string;
  defaultTime?: string;
  defaultTherapistId?: number | null;
  onClose: () => void;
  onSave: (payload: BookingDrawerPayload) => Promise<void>;
  onCancel?: () => Promise<void>;
  onCheckIn?: () => Promise<void>;
  onCheckOut?: () => Promise<void>;
  isSaving?: boolean;
}

export interface BookingDrawerPayload {
  client_id: number;
  date: string;
  start_time: string;
  source?: string;
  notes?: string;
  services: Array<{
    service_id: number;
    therapist_id?: number | null;
    room_id?: number | null;
    duration?: number;
    is_requested_therapist?: boolean;
  }>;
}

interface ServiceEntry {
  service_id: number;
  service_name: string;
  therapist_id: number | null;
  room_id: number | null;
  duration: number;
  is_requested_therapist: boolean;
  start_time?: string;
}

export function BookingDrawer({
  mode,
  booking,
  therapists,
  services,
  rooms,
  outletId,
  outletName,
  defaultDate,
  defaultTime,
  defaultTherapistId,
  onClose,
  onSave,
  onCancel,
  onCheckIn,
  onCheckOut,
  isSaving,
}: BookingDrawerProps) {
  const { toast } = useToast();
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [date, setDate] = useState(defaultDate || formatDate(new Date()));
  const [time, setTime] = useState(defaultTime || "09:00");
  const [source, setSource] = useState(booking?.source || "");
  const [notes, setNotes] = useState(booking?.notes || "");
  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: clientResults = [] } = useClientSearch(clientSearch);

  const therapistMap = new Map(therapists.map((t) => [t.id, t]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  useEffect(() => {
    if (booking) {
      setDate(booking.date || defaultDate || formatDate(new Date()));
      setTime(booking.start_time || defaultTime || "09:00");
      setSource(booking.source || "");
      setNotes(booking.notes || "");

      if (booking.client_id) {
        setSelectedClient({
          id: booking.client_id,
          name: booking.client_name || "",
          phone: booking.client_phone || "",
          client_since: booking.client_since,
        });
        setClientSearch(booking.client_name || "");
      }

      if (booking.services && booking.services.length > 0) {
        setServiceEntries(
          booking.services.map((s) => ({
            service_id: s.service_id,
            service_name: s.service_name || "",
            therapist_id: s.therapist_id ?? null,
            room_id: s.room_id ?? null,
            duration: s.duration || 60,
            is_requested_therapist: s.is_requested_therapist || false,
            start_time: s.start_time,
          }))
        );
      } else if (booking.therapist_id || booking.duration) {
        const svc = services[0];
        setServiceEntries([
          {
            service_id: svc?.id || 0,
            service_name: svc?.name || "",
            therapist_id: booking.therapist_id ?? defaultTherapistId ?? null,
            room_id: null,
            duration: booking.duration || svc?.duration || 60,
            is_requested_therapist: false,
          },
        ]);
      }
    } else {
      setDate(defaultDate || formatDate(new Date()));
      setTime(defaultTime || "09:00");
      if (defaultTherapistId && services.length > 0) {
        const svc = services[0];
        setServiceEntries([
          {
            service_id: svc.id,
            service_name: svc.name,
            therapist_id: defaultTherapistId,
            room_id: null,
            duration: svc.duration || 60,
            is_requested_therapist: false,
          },
        ]);
      }
    }
  }, [booking, defaultDate, defaultTime, defaultTherapistId, services]);

  const addServiceEntry = () => {
    const svc = services[0];
    if (!svc) return;
    setServiceEntries((prev) => [
      ...prev,
      {
        service_id: svc.id,
        service_name: svc.name,
        therapist_id: defaultTherapistId ?? null,
        room_id: null,
        duration: svc.duration || 60,
        is_requested_therapist: false,
      },
    ]);
  };

  const removeServiceEntry = (idx: number) => {
    setServiceEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateServiceEntry = (idx: number, field: keyof ServiceEntry, value: unknown) => {
    setServiceEntries((prev) =>
      prev.map((entry, i) => {
        if (i !== idx) return entry;
        if (field === "service_id") {
          const svc = serviceMap.get(value as number);
          return {
            ...entry,
            service_id: value as number,
            service_name: svc?.name || "",
            duration: svc?.duration || entry.duration,
          };
        }
        return { ...entry, [field]: value };
      })
    );
  };

  const handleSave = async () => {
    if (!selectedClient) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }
    if (serviceEntries.length === 0) {
      toast({ title: "Please add at least one service", variant: "destructive" });
      return;
    }
    try {
      await onSave({
        client_id: selectedClient.id,
        date,
        start_time: time,
        source,
        notes,
        services: serviceEntries.map((s) => ({
          service_id: s.service_id,
          therapist_id: s.therapist_id,
          room_id: s.room_id,
          duration: s.duration,
          is_requested_therapist: s.is_requested_therapist,
        })),
      });
    } catch {
      toast({ title: "Failed to save booking", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    try {
      await onCancel();
      setShowCancelConfirm(false);
    } catch {
      toast({ title: "Failed to cancel booking", variant: "destructive" });
    }
  };

  const status = booking?.status || "confirmed";
  const statusColors = {
    confirmed: "#6B7280",
    checked_in: "#6B7280",
    cancelled: "#6B7280",
    completed: "#6B7280",
  };

  const avatarInitials = (selectedClient?.name || booking?.client_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed right-0 top-0 bottom-0 bg-white shadow-2xl z-50 flex flex-col"
      style={{ width: "360px", borderLeft: "1px solid #E5E7EB" }}
      data-testid="booking-drawer"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="font-semibold text-gray-900 text-sm">
          {isCreate ? "New Booking" : isEdit ? "Update Booking" : "Appointment"}
        </h2>
        <div className="flex items-center gap-2">
          {isView && (
            <button className="text-gray-400 hover:text-gray-600" title="More options">
              <span className="text-lg">•••</span>
            </button>
          )}
          {isView && (
            <button className="text-gray-400 hover:text-gray-600" title="Edit" onClick={() => {}}>
              ✏️
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid="drawer-close">
            {(isCreate || isEdit) ? (
              <span className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50">Cancel</span>
            ) : (
              <X size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(isView || isEdit) && booking && (
          <div className="px-4 py-2 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    (status || "").toLowerCase().includes("cancel") ? "#9CA3AF" :
                    (status || "").toLowerCase().includes("check") ? "#EC4899" :
                    (status || "").toLowerCase().includes("complet") ? "#10B981" : "#93C5FD",
                }}
              />
              <span className="text-xs text-gray-600">{getStatusDisplayLabel(status)}</span>
            </div>
            {isView && canCheckIn(status) && (
              <button
                onClick={onCheckIn}
                className="text-xs font-semibold px-4 py-1.5 rounded text-white"
                style={{ backgroundColor: "#1F1E1D" }}
                data-testid="checkin-button"
              >
                Check-in
              </button>
            )}
            {isView && canCheckOut(status) && (
              <button
                onClick={onCheckOut}
                className="text-xs font-semibold px-4 py-1.5 rounded text-white"
                style={{ backgroundColor: "#1F1E1D" }}
                data-testid="checkout-button"
              >
                Checkout
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Outlet <span className="text-gray-800 font-medium">{outletName || "Liat Towers"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              On <span className="text-gray-900 font-medium">{formatDateDisplay(date)}</span>
            </span>
            <span className="text-gray-600">
              At <span className="text-gray-900 font-medium">{formatTime(time)}</span>
            </span>
          </div>

          {(isCreate || isEdit) && (
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-gray-400"
                data-testid="input-date"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-gray-400"
                data-testid="input-time"
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          {isCreate && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search or create client"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full text-xs border border-gray-200 rounded px-3 py-2 outline-none focus:border-gray-400"
                data-testid="input-client-search"
              />
              {showClientDropdown && clientSearch.length >= 2 && (
                <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-b shadow-lg z-50 max-h-48 overflow-y-auto">
                  {clientResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSelectedClient(c);
                        setClientSearch(c.name);
                        setShowClientDropdown(false);
                      }}
                      data-testid={`client-option-${c.id}`}
                    >
                      <div className="text-xs font-medium text-gray-900">{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                    </button>
                  ))}
                  {clientResults.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">No clients found</div>
                  )}
                </div>
              )}
            </div>
          )}

          {(isView || isEdit) && (booking?.client_id || selectedClient) && (
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: "#D97706" }}
              >
                {avatarInitials}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {booking?.client_phone && <span className="text-gray-500 mr-1">{booking.client_phone}</span>}
                  {booking?.client_name || selectedClient?.name}
                </div>
                {booking?.client_since && (
                  <div className="text-xs text-gray-500">Client since {booking.client_since}</div>
                )}
                {booking?.client_phone && (
                  <div className="text-xs text-gray-600 mt-0.5">Phone: {booking.client_phone}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Apply membership discount:</span>
                  <div className="w-8 h-4 rounded-full relative cursor-pointer" style={{ backgroundColor: "#F59E0B" }}>
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {serviceEntries.map((entry, idx) => {
            const therapist = entry.therapist_id ? therapistMap.get(entry.therapist_id) : null;
            const therapistColor = therapist ? getTherapistColor(therapist) : "#9CA3AF";

            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  {isEdit ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={entry.service_id}
                        onChange={(e) => updateServiceEntry(idx, "service_id", Number(e.target.value))}
                        className="text-sm font-semibold text-gray-900 border-none outline-none bg-transparent cursor-pointer"
                        data-testid={`select-service-${idx}`}
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900">
                      {entry.service_name || serviceMap.get(entry.service_id)?.name || "Service"}
                    </div>
                  )}
                  {isEdit && (
                    <button onClick={() => removeServiceEntry(idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">With:</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: therapistColor }}
                    />
                    {isEdit ? (
                      <select
                        value={entry.therapist_id || ""}
                        onChange={(e) => updateServiceEntry(idx, "therapist_id", e.target.value ? Number(e.target.value) : null)}
                        className="text-xs border-none outline-none bg-transparent cursor-pointer"
                        data-testid={`select-therapist-${idx}`}
                      >
                        <option value="">No therapist</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{therapist?.name || "Unassigned"}</span>
                    )}
                  </div>
                  {entry.is_requested_therapist && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded border border-gray-400 bg-gray-700 flex items-center justify-center">
                        <span className="text-white" style={{ fontSize: "7px" }}>✓</span>
                      </div>
                      <Info size={12} className="text-gray-400" />
                      <span className="text-gray-500">Requested Therapist</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>For: <span className="font-medium text-gray-900">{entry.duration || 60} min</span></span>
                  <span>At: {isEdit ? (
                    <input
                      type="time"
                      value={entry.start_time || time}
                      onChange={(e) => updateServiceEntry(idx, "start_time", e.target.value)}
                      className="text-xs border-none outline-none bg-transparent cursor-pointer"
                      data-testid={`input-service-time-${idx}`}
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{formatTime(entry.start_time || time)}</span>
                  )}
                  </span>
                </div>

                <div className="text-xs text-gray-600">
                  Using:{" "}
                  {isEdit ? (
                    <select
                      value={entry.room_id || ""}
                      onChange={(e) => updateServiceEntry(idx, "room_id", e.target.value ? Number(e.target.value) : null)}
                      className="text-xs border-none outline-none bg-transparent cursor-pointer"
                      data-testid={`select-room-${idx}`}
                    >
                      <option value="">No room</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-medium text-gray-900 ml-1">
                      {entry.room_id ? roomMap.get(entry.room_id)?.name || `Room ${entry.room_id}` : "No room"}
                    </span>
                  )}
                  {isEdit && <span className="ml-1 cursor-pointer text-gray-400">✏️</span>}
                </div>

                {isEdit && idx < serviceEntries.length - 1 && (
                  <hr className="border-gray-100" />
                )}
              </div>
            );
          })}

          {(isCreate || isEdit) && (
            <button
              onClick={addServiceEntry}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2"
              data-testid="add-service-button"
            >
              <Plus size={14} />
              Add service
            </button>
          )}
        </div>

        {(isView || isEdit) && booking?.notes && (
          <div className="border-t border-gray-100 mx-4 my-3 p-3 rounded" style={{ backgroundColor: "#FFFBEB" }}>
            <p className="text-xs text-gray-700">{booking.notes}</p>
          </div>
        )}

        {(isCreate || isEdit) && (
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none"
                data-testid="select-source"
              >
                <option value="">Select Source</option>
                <option value="By Phone">By Phone</option>
                <option value="Website">Website</option>
                <option value="Walk In">Walk In</option>
                <option value="App">App</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (Optional)"
                rows={3}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none resize-none focus:border-gray-400"
                data-testid="input-notes"
              />
            </div>
          </div>
        )}

        {isView && booking && (
          <div className="border-t border-gray-100 px-4 py-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Booking Details</h3>
            {[
              { label: "Booked on:", value: booking.booked_on },
              { label: "Booked by:", value: booking.booked_by },
              { label: "Updated on:", value: booking.updated_on },
              { label: "Updated by:", value: booking.updated_by },
              booking.cancelled_by ? { label: "Canceled by:", value: booking.cancelled_by } : null,
              { label: "Source:", value: booking.source },
            ]
              .filter(Boolean)
              .map(
                (item) =>
                  item && (
                    <div key={item.label} className="flex items-baseline gap-2 text-xs mb-1">
                      <span className="text-gray-500 flex-shrink-0">{item.label}</span>
                      <span className="text-gray-800">{item.value || "—"}</span>
                    </div>
                  )
              )}
          </div>
        )}

        {isView && canCancel(status) && (
          <div className="px-4 pb-3">
            {showCancelConfirm ? (
              <div className="border border-red-200 rounded p-3 bg-red-50">
                <p className="text-xs text-red-700 mb-2">Cancel this booking?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 text-xs bg-red-600 text-white rounded py-1.5 font-medium"
                    data-testid="confirm-cancel-button"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 text-xs border border-gray-300 rounded py-1.5 text-gray-700"
                  >
                    Keep
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-red-500 hover:text-red-700"
                data-testid="cancel-booking-button"
              >
                Cancel Booking
              </button>
            )}
          </div>
        )}
      </div>

      {(isCreate || isEdit) && (
        <div className="flex-shrink-0 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#1F1E1D" }}
            data-testid="save-booking-button"
          >
            {isSaving ? "Saving..." : isCreate ? "Create Booking" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}
