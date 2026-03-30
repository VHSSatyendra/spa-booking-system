import { useQuery } from "@tanstack/react-query";
import { getTherapists, getServices, getRooms, getOutlets, searchClients, getAuthToken } from "../services/api";

function isAuthed(): boolean {
  return !!getAuthToken();
}

export function useOutlets(isAuthenticated?: boolean) {
  return useQuery({
    queryKey: ["outlets"],
    queryFn: getOutlets,
    staleTime: 0,
    gcTime: 5 * 60_000,
    enabled: isAuthenticated !== undefined ? isAuthenticated : isAuthed(),
  });
}

export function useTherapists(outletId?: number, isAuthenticated?: boolean) {
  const authed = isAuthenticated !== undefined ? isAuthenticated : isAuthed();
  return useQuery({
    queryKey: ["therapists", outletId],
    queryFn: () => getTherapists(outletId),
    staleTime: 5 * 60_000,
    enabled: authed && !!outletId,
  });
}

export function useServices(outletId?: number, isAuthenticated?: boolean) {
  const authed = isAuthenticated !== undefined ? isAuthenticated : isAuthed();
  return useQuery({
    queryKey: ["services", outletId],
    queryFn: () => getServices(outletId),
    staleTime: 5 * 60_000,
    enabled: authed && !!outletId,
  });
}

export function useRooms(outletId?: number, isAuthenticated?: boolean) {
  const authed = isAuthenticated !== undefined ? isAuthenticated : isAuthed();
  return useQuery({
    queryKey: ["rooms", outletId],
    queryFn: () => getRooms(outletId),
    staleTime: 5 * 60_000,
    enabled: authed && !!outletId,
  });
}

export function useClientSearch(query: string, isAuthenticated?: boolean) {
  const authed = isAuthenticated !== undefined ? isAuthenticated : isAuthed();
  return useQuery({
    queryKey: ["clients", "search", query],
    queryFn: () => searchClients(query),
    enabled: authed && query.length >= 2,
    staleTime: 10_000,
  });
}
