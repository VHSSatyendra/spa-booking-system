import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, Search } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { BookingGrid } from "../components/BookingGrid";
import { BookingDrawer } from "../components/BookingDrawer";
import { FilterPanel } from "../components/FilterPanel";
import { useBookings, useCreateBooking, useUpdateBooking, useCancelBooking, useCheckIn, useCheckOut } from "../hooks/useBookings";
import { useTherapists, useServices, useRooms, useOutlets } from "../hooks/useResources";
import { formatDate, addDays } from "../utils/timeHelpers";
import type { Booking } from "../services/api";
import type { BookingDrawerPayload } from "../components/BookingDrawer";
import { useToast } from "@/hooks/use-toast";

interface CalendarPageProps {
  isAuthenticated?: boolean;
}

export function CalendarPage({ isAuthenticated = true }: CalendarPageProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create" | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [defaultSlot, setDefaultSlot] = useState<{ therapistId: number | null; time: string } | null>(null);
  const [outletId, setOutletId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const dateStr = formatDate(currentDate);
  const displayDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const { data: outlets = [] } = useOutlets(isAuthenticated);
  const currentOutlet = outlets.find((o) => o.id === outletId);

  useEffect(() => {
    console.log("[CalendarPage] outlets:", outlets.length, "outletId:", outletId);
    if (outlets.length > 0 && outletId === 0) {
      console.log("[CalendarPage] Setting outletId to:", outlets[0].id, outlets[0].name);
      setOutletId(outlets[0].id);
    }
  }, [outlets, outletId]);

  const { data: bookings = [], isLoading: bookingsLoading } = useBookings(dateStr, outletId, isAuthenticated);
  const { data: therapists = [], isLoading: therapistsLoading } = useTherapists(outletId, isAuthenticated);
  const { data: services = [] } = useServices(outletId, isAuthenticated);
  const { data: rooms = [] } = useRooms(outletId, isAuthenticated);

  console.log("[CalendarPage] render — outletId:", outletId, "therapists:", therapists.length, "therapistsLoading:", therapistsLoading, "bookingsLoading:", bookingsLoading);

  const createMutation = useCreateBooking(dateStr, outletId);
  const updateMutation = useUpdateBooking(dateStr, outletId);
  const cancelMutation = useCancelBooking(dateStr, outletId);
  const checkInMutation = useCheckIn(dateStr, outletId);
  const checkOutMutation = useCheckOut(dateStr, outletId);

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.client_name?.toLowerCase().includes(q) ||
      b.client_phone?.includes(q) ||
      b.booking_number?.toLowerCase().includes(q)
    );
  });

  const handleBookingClick = useCallback((booking: Booking) => {
    console.log("[UI] Booking clicked", booking.id);
    setSelectedBooking(booking);
    setDrawerMode("view");
    setShowFilter(false);
  }, []);

  const handleSlotClick = useCallback((therapistId: number | null, time: string) => {
    console.log("[UI] Empty slot clicked", therapistId, time);
    setDefaultSlot({ therapistId, time });
    setSelectedBooking(null);
    setDrawerMode("create");
    setShowFilter(false);
  }, []);

  const handleClose = useCallback(() => {
    setDrawerMode(null);
    setSelectedBooking(null);
    setDefaultSlot(null);
  }, []);

  const handleSave = useCallback(async (payload: BookingDrawerPayload) => {
    if (drawerMode === "create") {
      console.log("[UI] Creating booking", payload);
      await createMutation.mutateAsync({
        outlet_id: outletId,
        ...payload,
      });
      toast({ title: "Booking created successfully" });
      console.log("[Booking] Created booking");
    } else if (drawerMode === "edit" && selectedBooking) {
      console.log("[UI] Updating booking", selectedBooking.id, payload);
      await updateMutation.mutateAsync({
        id: selectedBooking.id,
        payload: { outlet_id: outletId, ...payload },
      });
      toast({ title: "Booking updated successfully" });
      console.log("[Booking] Updated booking", selectedBooking.id);
    }
    handleClose();
  }, [drawerMode, selectedBooking, outletId, createMutation, updateMutation, handleClose, toast]);

  const handleCancelBooking = useCallback(async () => {
    if (!selectedBooking) return;
    console.log("[UI] Cancelling booking", selectedBooking.id);
    await cancelMutation.mutateAsync({ id: selectedBooking.id });
    toast({ title: "Booking cancelled" });
    console.log("[Booking] Cancelled booking", selectedBooking.id);
    handleClose();
  }, [selectedBooking, cancelMutation, handleClose, toast]);

  const handleCheckIn = useCallback(async () => {
    if (!selectedBooking) return;
    console.log("[UI] Checking in booking", selectedBooking.id);
    await checkInMutation.mutateAsync(selectedBooking.id);
    toast({ title: "Client checked in" });
    console.log("[Booking] Checked in booking", selectedBooking.id);
    handleClose();
  }, [selectedBooking, checkInMutation, handleClose, toast]);

  const handleCheckOut = useCallback(async () => {
    if (!selectedBooking) return;
    console.log("[UI] Checking out booking", selectedBooking.id);
    await checkOutMutation.mutateAsync(selectedBooking.id);
    toast({ title: "Client checked out" });
    console.log("[Booking] Checked out booking", selectedBooking.id);
    handleClose();
  }, [selectedBooking, checkOutMutation, handleClose, toast]);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    cancelMutation.isPending ||
    checkInMutation.isPending ||
    checkOutMutation.isPending;

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <Navbar userName="Sandy" />

      <div
        className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0"
        style={{ minHeight: "48px" }}
      >
        <div className="flex items-center gap-2">
          <div>
            <span className="font-semibold text-gray-900 text-sm">{currentOutlet?.name || "Liat Towers"}</span>
            {outlets.length > 1 && (
              <select
                value={outletId}
                onChange={(e) => setOutletId(Number(e.target.value))}
                className="ml-2 text-xs border border-gray-200 rounded px-1 py-0.5 outline-none"
                data-testid="select-outlet"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
          <ChevronLeft size={16} className="text-gray-400" />
          <span className="text-xs text-gray-500">Display: 15 Min</span>
          <ChevronLeft size={14} className="text-gray-400" />
        </div>

        <div className="flex items-center gap-2 flex-1 mx-4 max-w-md">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search bookings by phone/name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowFilter(!showFilter); setDrawerMode(null); }}
            className="flex items-center gap-1 text-xs border border-gray-200 rounded px-3 py-1.5 bg-white hover:bg-gray-50"
            data-testid="filter-button"
          >
            Filter
            <SlidersHorizontal size={13} />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs border border-gray-200 rounded px-3 py-1.5 bg-white hover:bg-gray-50"
            data-testid="today-button"
          >
            Today
          </button>

          <div className="flex items-center gap-1 border border-gray-200 rounded bg-white">
            <button
              onClick={() => setCurrentDate((d) => addDays(d, -1))}
              className="px-2 py-1.5 hover:bg-gray-50"
              data-testid="prev-day-button"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium px-2 min-w-[80px] text-center">{displayDate}</span>
            <button
              onClick={() => setCurrentDate((d) => addDays(d, 1))}
              className="px-2 py-1.5 hover:bg-gray-50"
              data-testid="next-day-button"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button className="px-2 py-1.5 border border-gray-200 rounded bg-white hover:bg-gray-50">
            <Calendar size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {outletId === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-sm animate-pulse">Loading outlets...</div>
          </div>
        ) : (
          <BookingGrid
            bookings={filteredBookings}
            therapists={therapists}
            therapistsLoading={therapistsLoading}
            bookingsLoading={bookingsLoading}
            onBookingClick={handleBookingClick}
            onSlotClick={handleSlotClick}
            selectedBookingId={selectedBooking?.id}
          />
        )}

        {drawerMode && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={handleClose} />
            <BookingDrawer
              mode={drawerMode}
              booking={selectedBooking}
              therapists={therapists}
              services={services}
              rooms={rooms}
              outletId={outletId}
              outletName={currentOutlet?.name}
              defaultDate={dateStr}
              defaultTime={defaultSlot?.time}
              defaultTherapistId={defaultSlot?.therapistId}
              onClose={handleClose}
              onSave={handleSave}
              onCancel={handleCancelBooking}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isSaving={isSaving}
            />
          </>
        )}

        {showFilter && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={() => setShowFilter(false)} />
            <FilterPanel onClose={() => setShowFilter(false)} />
          </>
        )}
      </div>
    </div>
  );
}
