import { useQuery } from "@tanstack/react-query";
import { getBookings } from "../api/bookingApi";

export const useBookings = (date, options = {}) => {
  return useQuery({
    queryKey: ["bookings", date],
    queryFn: () => getBookings(date),
    enabled: !!date,
    ...options,
  });
};
