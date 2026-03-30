import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getAuthToken,
  type CreateBookingPayload,
  type UpdateBookingPayload,
} from "../services/api";

export function useBookings(date: string, outletId?: number, isAuthenticated?: boolean) {
  return useQuery({
    queryKey: ["bookings", date, outletId],
    queryFn: () => getBookings(date, outletId),
    enabled: !!date && !!outletId && (isAuthenticated !== undefined ? isAuthenticated : !!getAuthToken()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useBooking(id: number | null) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBooking(id!),
    enabled: !!id && !!getAuthToken(),
    staleTime: 10_000,
  });
}

export function useCreateBooking(date: string, outletId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: (data) => {
      console.log("[Booking] Created booking", data?.id);
      queryClient.invalidateQueries({ queryKey: ["bookings", date, outletId] });
    },
    onError: (e) => {
      console.error("[Booking] Create failed", e);
    },
  });
}

export function useUpdateBooking(date: string, outletId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBookingPayload }) =>
      updateBooking(id, payload),
    onSuccess: (data, vars) => {
      console.log("[Booking] Updated booking", vars.id);
      queryClient.invalidateQueries({ queryKey: ["bookings", date, outletId] });
      queryClient.invalidateQueries({ queryKey: ["booking", vars.id] });
    },
    onError: (e) => {
      console.error("[Booking] Update failed", e);
    },
  });
}

export function useCancelBooking(date: string, outletId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cancelBooking(id, reason),
    onSuccess: (_data, vars) => {
      console.log("[Booking] Cancelled booking", vars.id);
      queryClient.invalidateQueries({ queryKey: ["bookings", date, outletId] });
      queryClient.invalidateQueries({ queryKey: ["booking", vars.id] });
    },
    onError: (e) => {
      console.error("[Booking] Cancel failed", e);
    },
  });
}

export function useCheckIn(date: string, outletId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => checkInBooking(id),
    onSuccess: (_data, id) => {
      console.log("[Booking] Checked in", id);
      queryClient.invalidateQueries({ queryKey: ["bookings", date, outletId] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (e) => {
      console.error("[Booking] Check-in failed", e);
    },
  });
}

export function useCheckOut(date: string, outletId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => checkOutBooking(id),
    onSuccess: (_data, id) => {
      console.log("[Booking] Checked out", id);
      queryClient.invalidateQueries({ queryKey: ["bookings", date, outletId] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (e) => {
      console.error("[Booking] Check-out failed", e);
    },
  });
}
