import { useQuery } from "@tanstack/react-query";
import { getTimings } from "../api/bookingApi";

export const useTimings = (date) => {
  return useQuery({
    queryKey: ["timings", date],
    queryFn: async () => {
      try {
        return await getTimings(date);
      } catch (err) {
        console.log("TIMING API ERROR 👉", err.response?.data);
        throw err;
      }
    },
  });
};
