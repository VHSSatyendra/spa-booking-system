import { useQuery } from "@tanstack/react-query";
import { getTherapists } from "../api/bookingApi";

export const useTherapists = (date) => {
  return useQuery({
    queryKey: ["therapists", date],
    queryFn: () => getTherapists(date),
    enabled: !!date,
  });
};
