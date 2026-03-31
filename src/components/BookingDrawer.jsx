import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Info, Clock, Calendar } from "lucide-react";

const API_BASE_URL = "https://dev.natureland.hipster-virtual.com/api/v1";

const DEFAULT_COMPANY_ID = 1;
const DEFAULT_OUTLET_ID = 1;
const DEFAULT_BOOKING_TYPE_ID = 1;
const DEFAULT_MEMBERSHIP_ID = 0;
const DEFAULT_SOURCE = "Walk-in";
const DEFAULT_CUSTOMER_ID = 229053;
const DEFAULT_CUSTOMER_NAME = "Abhishek";
const DEFAULT_SERVICE_ID = 1;
const DEFAULT_THERAPIST_ID = 529;
const DEFAULT_PRICE = 24;

const pad = (value) => String(value).padStart(2, "0");

const toDateObject = (value) => {
  if (value instanceof Date) return value;

  if (!value) return new Date();

  const raw = String(value).trim();
  const datePart = raw.includes(" ") ? raw.split(" ")[0] : raw;
  const parsed = new Date(datePart);

  if (!Number.isNaN(parsed.getTime())) return parsed;

  return new Date();
};

const formatDateYYYYMMDD = (value) => {
  const date = toDateObject(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const to24HourTime = (timeInput) => {
  if (!timeInput || typeof timeInput !== "string") {
    return "00:00:00";
  }

  const cleaned = timeInput.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?$/i);

  if (!match) {
    return "00:00:00";
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const second = match[3] || "00";
  const meridian = match[4] ? match[4].toUpperCase() : null;

  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;

  return `${pad(hour)}:${minute}:${second}`;
};

const addMinutesToTime = (time24, minutes) => {
  const parts = String(time24).split(":");
  const hour = Number(parts[0]) || 0;
  const minute = Number(parts[1]) || 0;
  const second = Number(parts[2]) || 0;

  const totalMinutes = hour * 60 + minute + Number(minutes || 0);
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);

  const nextHour = Math.floor(normalized / 60);
  const nextMinute = normalized % 60;

  return `${pad(nextHour)}:${pad(nextMinute)}:${pad(second)}`;
};

const parseDuration = (durationValue) => {
  if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
    return durationValue;
  }

  const parsed = Number.parseInt(
    String(durationValue || "").replace(/[^\d]/g, ""),
    10,
  );

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
};

const parsePrice = (priceValue) => {
  const parsed = Number(priceValue);
  return Number.isFinite(parsed) ? parsed : DEFAULT_PRICE;
};

const BookingDrawer = ({ isOpen, onClose, data, onSuccess, selectedDate }) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // INITIAL STATE: If 'data' exists, we are in Edit/View mode. If not, 'Create' mode.
  // Using the 'key' pattern in the parent ensures this state resets correctly.
  const [formData] = useState(
    data || {
      id: null,
      status: "New",
      clientName: "",
      phone: "",
      date: "Tue, Aug 8",
      time: "09:30 PM",
      services: [
        {
          id: 1,
          name: "60 Mins Body Therapy",
          duration: "60 min",
          time: "9:30 AM",
          therapist: "Lily",
          room: "806 Couples Room",
        },
      ],
      notes:
        "I have an allergy to eucalyptus, lavender, and citrus oils. Please avoid using them in my body massage.",
    },
  );

  const isEditMode = !!data;
  const isCancelled = formData.status?.includes("Cancelled");

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const primaryService = Array.isArray(formData.services)
        ? formData.services[0] || {}
        : {};

      const startTime24 = to24HourTime(primaryService.time || formData.time);
      const serviceDuration = parseDuration(primaryService.duration);
      const endTime24 = addMinutesToTime(startTime24, serviceDuration);

      const serviceAt = `${formatDateYYYYMMDD(
        selectedDate || data?.service_at || data?.service_date || new Date(),
      )} ${startTime24}`;

      const customerName =
        formData.clientName?.trim() ||
        data?.user?.name ||
        DEFAULT_CUSTOMER_NAME;

      const payload = {
        company: Number(data?.company_id ?? DEFAULT_COMPANY_ID),
        source: data?.source || DEFAULT_SOURCE,
        membership: Number(data?.membership ?? DEFAULT_MEMBERSHIP_ID),
        outlet: Number(data?.outlet_id ?? DEFAULT_OUTLET_ID),
        booking_type: Number(data?.booking_type_id ?? DEFAULT_BOOKING_TYPE_ID),
        service_at: serviceAt,
        customer: Number(data?.user_id ?? DEFAULT_CUSTOMER_ID),
        items: [
          {
            service: Number(
              primaryService.serviceId ??
                primaryService.service_id ??
                primaryService.id ??
                DEFAULT_SERVICE_ID,
            ),
            start_time: startTime24,
            end_time: endTime24,
            duration: serviceDuration,
            quantity: 1,
            price: parsePrice(primaryService.price),
            customer_name: customerName,
            item_number: Number(primaryService.item_number ?? 1),
            therapist_id: Number(
              primaryService.therapistId ??
                primaryService.therapist_id ??
                DEFAULT_THERAPIST_ID,
            ),
          },
        ],
      };

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.data?.success) {
        throw new Error(
          result?.message ||
            result?.data?.message ||
            "Unable to create booking",
        );
      }

      const booking = result?.data?.data?.booking;

      if (booking) {
        queryClient.setQueryData(["bookings"], (oldData) => {
          const existing = Array.isArray(oldData) ? oldData : [];
          return [
            booking,
            ...existing.filter((item) => item?.id !== booking?.id),
          ];
        });

        if (typeof onSuccess === "function") {
          onSuccess(booking);
        }
      }

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (error) {
      console.error("Create booking failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out w-[450px] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditMode ? "Appointment" : "New Booking"}
          </h2>
          <div className="flex items-center gap-3">
            {isEditMode && (
              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                <Edit2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-1.5 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* STATUS BAR (Dynamic based on Booking Status) */}
        {isEditMode && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  formData.status === "Checked in"
                    ? "bg-pink-500"
                    : isCancelled
                      ? "bg-gray-400"
                      : "bg-blue-400"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {formData.status}
              </span>
            </div>

            {!isCancelled && (
              <button className="bg-[#4A3728] text-white px-5 py-1.5 rounded text-sm font-bold hover:bg-[#3d2d21]">
                {formData.status === "Confirmed" ? "Check-in" : "Checkout"}
              </button>
            )}
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Date & Time Selectors */}
          <div className="grid grid-cols-2 border border-gray-200 rounded-sm">
            <div className="p-3 border-r border-gray-200">
              <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">
                On
              </label>
              <div className="flex items-center justify-between font-medium text-sm">
                <span>{formData.date}</span>
                <Calendar size={14} className="text-gray-300" />
              </div>
            </div>
            <div className="p-3">
              <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">
                At
              </label>
              <div className="flex items-center justify-between font-medium text-sm">
                <span>{formData.time}</span>
                <Clock size={14} className="text-gray-300" />
              </div>
            </div>
          </div>

          {/* Client Selection Area */}
          <div className="space-y-3">
            {!isEditMode ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or create client"
                  className="w-full p-2.5 pr-10 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-gray-400"
                />
                <Plus
                  size={18}
                  className="absolute right-3 top-2.5 text-gray-400"
                />
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                  VB
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">
                    92214868 Victoria Baker
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Client since December 2023
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs italic text-gray-500 underline decoration-gray-300">
                      Apply membership discount:
                    </span>
                    <input
                      type="checkbox"
                      className="w-9 h-5 bg-gray-200 rounded-full appearance-none cursor-pointer checked:bg-orange-400 relative transition-colors before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Service Card */}
          {formData.services.map((service, idx) => (
            <div key={idx} className="pt-5 border-t border-gray-100 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-[13px] text-gray-800">
                  {service.name}
                </h3>
                <Trash2
                  size={16}
                  className="text-gray-200 hover:text-red-400 cursor-pointer transition-colors"
                />
              </div>

              <div className="grid gap-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span>With:</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-3 h-3 bg-pink-500 text-white rounded-full flex items-center justify-center text-[8px]">
                      12
                    </span>{" "}
                    Lily
                  </span>
                  <span className="flex items-center gap-1 font-bold text-gray-800 ml-2 italic">
                    <Edit2 size={10} className="fill-current" /> Requested
                    Therapist <Info size={12} />
                  </span>
                </div>
                <p>
                  For:{" "}
                  <span className="font-bold text-gray-900">
                    {service.duration}
                  </span>{" "}
                  At:{" "}
                  <span className="font-bold text-gray-900">
                    {service.time}
                  </span>
                </p>
                <p>
                  Using:{" "}
                  <span className="font-bold text-gray-900 underline decoration-dotted">
                    806 Couples Room
                  </span>{" "}
                  <Edit2 size={10} className="inline ml-1" />
                </p>
                <p>
                  Select request(s):{" "}
                  <span className="font-bold text-gray-900 underline decoration-dotted">
                    Soft, China
                  </span>{" "}
                  <Edit2 size={10} className="inline ml-1" />
                </p>
              </div>
            </div>
          ))}

          {/* Add Service Buttons (Create Mode) */}
          {!isEditMode && (
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-sm text-xs font-bold text-gray-500 hover:bg-gray-50">
                <Plus size={14} /> Add service
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-sm text-xs font-bold text-gray-500 hover:bg-gray-50">
                <Plus size={14} /> Add pax
              </button>
            </div>
          )}

          {/* Allergy Note Box */}
          <div className="bg-[#FEF9E7] border border-[#F9E79F] p-4 rounded-sm flex gap-3 leading-relaxed">
            <div className="shrink-0 pt-0.5">
              <Info size={16} className="text-[#D4AC0D]" />
            </div>
            <p className="text-xs text-gray-700 font-medium">
              I have an allergy to eucalyptus, lavender, and citrus oils. Please
              avoid using them in my body massage.
            </p>
          </div>

          {/* Audit Details (Bottom Section) */}
          {isEditMode && (
            <div className="pt-6 border-t border-gray-100 space-y-2">
              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                Booking Details
              </h4>
              <div className="text-[10px] text-gray-400 space-y-1 uppercase font-bold tracking-tight">
                <p>
                  Booked on:{" "}
                  <span className="text-gray-500">Thu, May 22 at 5:34 PM</span>
                </p>
                <p>
                  Booked by:{" "}
                  <span className="text-gray-500">Victoria Baker</span>
                </p>
                {isCancelled && (
                  <p>
                    Cancelled on:{" "}
                    <span className="text-gray-500">
                      Thu, Jun 13 at 5:34 PM
                    </span>
                  </p>
                )}
                <p>
                  Source: <span className="text-gray-500">Website</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
          <button
            onClick={handleSave}
            className="w-full bg-[#4A3728] text-white py-3.5 rounded-sm font-bold text-sm shadow-lg hover:bg-[#3d2d21] transition-all active:scale-[0.98]"
          >
            {isEditMode ? "Save Changes" : "Create Booking"}
          </button>
        </div>
      </div>
    </>
  );
};

export default BookingDrawer;
