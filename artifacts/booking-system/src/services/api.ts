import axios from "axios";

const BASE_PATH = import.meta.env.BASE_URL || "/";
const API_BASE = `${BASE_PATH}api/v1`.replace(/\/+/g, "/");

export const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  localStorage.setItem("auth_token", token);
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem("auth_token");
    if (authToken) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    }
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  delete apiClient.defaults.headers.common["Authorization"];
  localStorage.removeItem("auth_token");
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    console.error("[API Error]", error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

function extractToken(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  if (typeof o.token === "string") return o.token;
  if (typeof o.token === "object" && o.token) {
    const t = o.token as Record<string, unknown>;
    if (typeof t.token === "string") return t.token;
  }
  if (o.data) return extractToken(o.data);
  return undefined;
}

export async function login(email: string, password: string, key_pass: string) {
  const response = await apiClient.post(`${API_BASE}/login`, {
    email,
    password,
    key_pass,
    recaptcha_response: "bypass",
  });
  const token = extractToken(response.data);
  if (token) {
    setAuthToken(token);
    console.log("[API] Token acquired");
  } else {
    console.warn("[API] No token in login response", JSON.stringify(response.data).substring(0, 200));
  }
  return response.data;
}

export interface Outlet {
  id: number;
  name: string;
  code: string;
  staff?: Therapist[];
  service?: ServiceCategory[];
}

export interface Therapist {
  id: number;
  name: string;
  alias?: string;
  gender?: string;
  outlet_id?: number;
}

export interface ServiceCategory {
  category_id: number;
  category_name: string;
  service_items: Service[];
}

export interface Service {
  id: number;
  name: string;
  duration?: number;
  price?: number;
  category?: string;
  category_id?: number;
  category_name?: string;
}

export interface Room {
  id: number;
  name: string;
  outlet_id?: number;
}

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  membership_number?: string;
  client_since?: string;
}

export interface BookingService {
  id?: number;
  service_id: number;
  service_name?: string;
  therapist_id?: number | null;
  therapist_name?: string | null;
  room_id?: number | null;
  room_name?: string | null;
  duration?: number;
  start_time?: string;
  price?: number;
  is_requested_therapist?: boolean;
  request_types?: string[];
  commission?: number;
}

export interface Booking {
  id: number;
  booking_number?: string;
  client_id?: number;
  client_name?: string;
  client_phone?: string;
  client_since?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  status?: string;
  status_label?: string;
  outlet_id?: number;
  outlet_name?: string;
  therapist_id?: number | null;
  therapist_name?: string | null;
  services?: BookingService[];
  notes?: string;
  source?: string;
  booked_on?: string;
  booked_by?: string;
  updated_on?: string;
  updated_by?: string;
  cancelled_by?: string;
  cancelled_on?: string;
}

function normalizeBooking(raw: Record<string, unknown>): Booking {
  const services = (raw.booking_services || raw.services || raw.items || []) as Record<string, unknown>[];
  return {
    id: raw.id as number,
    booking_number: (raw.booking_number || raw.bookingNumber) as string,
    client_id: (raw.client_id || raw.clientId) as number,
    client_name: (raw.client_name || raw.clientName || (raw.client as Record<string, unknown>)?.name) as string,
    client_phone: (raw.client_phone || raw.clientPhone || (raw.client as Record<string, unknown>)?.phone) as string,
    client_since: (raw.client_since || (raw.client as Record<string, unknown>)?.client_since) as string,
    date: raw.date as string,
    start_time: (raw.start_time || raw.startTime) as string,
    end_time: (raw.end_time || raw.endTime) as string,
    duration: raw.duration as number,
    status: raw.status as string,
    status_label: (raw.status_label || raw.statusLabel) as string,
    outlet_id: (raw.outlet_id || raw.outletId) as number,
    outlet_name: (raw.outlet_name || (raw.outlet as Record<string, unknown>)?.name) as string,
    therapist_id: (raw.therapist_id ?? raw.therapistId ?? null) as number | null,
    therapist_name: (raw.therapist_name || raw.therapistName || (raw.therapist as Record<string, unknown>)?.name || null) as string | null,
    services: services.map((s) => ({
      id: s.id as number,
      service_id: (s.service_id || s.serviceId || s.id) as number,
      service_name: (s.service_name || s.serviceName || (s.service as Record<string, unknown>)?.name) as string,
      therapist_id: (s.therapist_id ?? s.therapistId ?? null) as number | null,
      therapist_name: (s.therapist_name || s.therapistName || (s.therapist as Record<string, unknown>)?.name || null) as string | null,
      room_id: (s.room_id ?? s.roomId ?? null) as number | null,
      room_name: (s.room_name || s.roomName || (s.room as Record<string, unknown>)?.name || null) as string | null,
      duration: s.duration as number,
      start_time: (s.start_time || s.startTime) as string,
      price: s.price as number,
      is_requested_therapist: (s.is_requested_therapist || s.isRequestedTherapist) as boolean,
      request_types: (s.request_types || s.requestTypes || []) as string[],
      commission: s.commission as number,
    })),
    notes: raw.notes as string,
    source: raw.source as string,
    booked_on: (raw.booked_on || raw.bookedOn) as string,
    booked_by: (raw.booked_by || raw.bookedBy) as string,
    updated_on: (raw.updated_on || raw.updatedOn) as string,
    updated_by: (raw.updated_by || raw.updatedBy) as string,
    cancelled_by: (raw.cancelled_by || raw.cancelledBy) as string,
    cancelled_on: (raw.cancelled_on || raw.cancelledOn) as string,
  };
}

function extractBookingList(data: unknown): Booking[] {
  if (!data) return [];
  const raw = data as Record<string, unknown>;

  let list: unknown[] | null = null;

  function findList(obj: unknown, depth = 0): unknown[] | null {
    if (!obj || typeof obj !== "object" || depth > 5) return null;
    const o = obj as Record<string, unknown>;
    if (Array.isArray(o)) {
      if ((o as unknown[]).length === 0 || typeof (o as unknown[])[0] === "object") return o as unknown[];
      return null;
    }
    for (const key of ["bookingData", "bookings", "data", "list", "items"]) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
      if (o[key] && typeof o[key] === "object") {
        const found = findList(o[key], depth + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }

  list = findList(raw);

  if (!list) {
    console.warn("[API] Could not extract booking list from response");
    return [];
  }
  return (list as Record<string, unknown>[]).map(normalizeBooking);
}

function extractSingleBooking(data: unknown): Booking | null {
  if (!data) return null;

  function findBooking(obj: unknown, depth = 0): Record<string, unknown> | null {
    if (!obj || typeof obj !== "object" || depth > 5) return null;
    if (Array.isArray(obj)) return null;
    const o = obj as Record<string, unknown>;
    if (typeof o.id === "number" || typeof o.id === "string") return o;
    for (const key of ["booking", "data"]) {
      if (o[key]) {
        const found = findBooking(o[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const found = findBooking(data);
  if (!found) {
    console.warn("[API] Could not extract single booking from response");
    return null;
  }
  return normalizeBooking(found);
}

export async function getOutlets(): Promise<Outlet[]> {
  try {
    const response = await apiClient.get(`${API_BASE}/outlets`);
    const raw = response.data as Record<string, unknown>;
    const list = (raw?.data as Record<string, unknown>)?.data as Record<string, unknown>;
    const outlets = list?.list as Record<string, unknown>;
    if (Array.isArray(outlets?.outlets)) {
      const all = outlets.outlets as (Outlet & { staff?: unknown[] })[];
      const withStaff = all.filter((o) => Array.isArray(o.staff) && o.staff.length > 0);
      return withStaff.length > 0 ? withStaff : all;
    }
    console.warn("[API] getOutlets: unexpected shape", raw);
    return [];
  } catch (e) {
    console.error("[API] getOutlets failed", e);
    return [];
  }
}

export async function getOutletDetail(outletId: number): Promise<Outlet | null> {
  try {
    const response = await apiClient.get(`${API_BASE}/outlets/${outletId}`);
    const raw = response.data as Record<string, unknown>;
    const detail = (raw?.data as Record<string, unknown>)?.data as Record<string, unknown>;
    if (detail?.id) {
      return detail as unknown as Outlet;
    }
    return null;
  } catch (e) {
    console.error("[API] getOutletDetail failed", e);
    return null;
  }
}

export async function getTherapists(outletId?: number): Promise<Therapist[]> {
  if (!outletId) return [];
  try {
    console.log("[API] getTherapists fetching outlet", outletId);
    const detail = await getOutletDetail(outletId);
    console.log("[API] getTherapists detail staff:", detail?.staff?.length ?? "no staff");
    if (detail?.staff && Array.isArray(detail.staff)) {
      const mapped = detail.staff.map((s) => ({
        ...s,
        name: s.alias || s.name || `Therapist ${s.id}`,
        outlet_id: outletId,
      }));
      console.log("[API] getTherapists returning", mapped.length, "therapists, first:", mapped[0]?.name);
      return mapped;
    }
    console.warn("[API] getTherapists no staff array for outlet", outletId, "detail keys:", Object.keys(detail || {}));
    return [];
  } catch (e) {
    console.error("[API] getTherapists failed", e);
    return [];
  }
}

export async function getServices(outletId?: number): Promise<Service[]> {
  if (!outletId) return [];
  try {
    const detail = await getOutletDetail(outletId);
    if (detail?.service && Array.isArray(detail.service)) {
      const flat: Service[] = [];
      for (const cat of detail.service as ServiceCategory[]) {
        for (const item of cat.service_items || []) {
          flat.push({
            ...item,
            category: cat.category_name,
            category_id: cat.category_id,
            category_name: cat.category_name,
          });
        }
      }
      return flat;
    }
    return [];
  } catch (e) {
    console.error("[API] getServices failed", e);
    return [];
  }
}

export async function getRooms(outletId?: number): Promise<Room[]> {
  if (!outletId) return [];
  try {
    const response = await apiClient.get(`${API_BASE}/rooms`, { params: { outlet_id: outletId } });
    const raw = response.data as Record<string, unknown>;
    const inner = (raw?.data as Record<string, unknown>)?.data as Record<string, unknown>;
    const list = inner?.list as Record<string, unknown>;
    if (Array.isArray(list?.rooms)) return list.rooms as Room[];
    if (Array.isArray(list?.data)) return list.data as Room[];
    return [];
  } catch (e) {
    console.error("[API] getRooms failed", e);
    return [];
  }
}

export async function searchClients(query: string): Promise<Client[]> {
  try {
    const response = await apiClient.get(`${API_BASE}/clients/search`, {
      params: { q: query, search: query },
    });
    const raw = response.data as Record<string, unknown>;
    const inner = (raw?.data as Record<string, unknown>)?.data as Record<string, unknown>;
    if (Array.isArray(inner?.clients)) return inner.clients as Client[];
    if (Array.isArray(inner?.data)) return inner.data as Client[];
    if (Array.isArray(raw?.data)) return raw.data as Client[];
    return [];
  } catch (e) {
    console.error("[API] searchClients failed", e);
    return [];
  }
}

export async function getBookings(date: string, outletId?: number): Promise<Booking[]> {
  try {
    const params: Record<string, unknown> = { date };
    if (outletId) params.outlet_id = outletId;
    const response = await apiClient.get(`${API_BASE}/bookings/schedule`, { params });
    console.log("[API] getBookings raw response", JSON.stringify(response.data).substring(0, 500));
    return extractBookingList(response.data);
  } catch (e) {
    console.error("[API] getBookings failed", e);
    return [];
  }
}

export async function getBooking(id: number): Promise<Booking | null> {
  try {
    const response = await apiClient.get(`${API_BASE}/bookings/${id}`);
    return extractSingleBooking(response.data);
  } catch (e) {
    console.error("[API] getBooking failed", e);
    return null;
  }
}

export interface CreateBookingPayload {
  outlet_id: number;
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
    start_time?: string;
    is_requested_therapist?: boolean;
  }>;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking | null> {
  try {
    const response = await apiClient.post(`${API_BASE}/bookings/create`, payload);
    return extractSingleBooking(response.data);
  } catch (e) {
    console.error("[API] createBooking failed", e);
    throw e;
  }
}

export interface UpdateBookingPayload {
  outlet_id?: number;
  client_id?: number;
  date?: string;
  start_time?: string;
  source?: string;
  notes?: string;
  services?: Array<{
    id?: number;
    service_id: number;
    therapist_id?: number | null;
    room_id?: number | null;
    duration?: number;
    start_time?: string;
    is_requested_therapist?: boolean;
  }>;
}

export async function updateBooking(id: number, payload: UpdateBookingPayload): Promise<Booking | null> {
  try {
    const response = await apiClient.post(`${API_BASE}/bookings/${id}/update`, payload);
    return extractSingleBooking(response.data);
  } catch (e) {
    console.error("[API] updateBooking failed", e);
    throw e;
  }
}

export async function cancelBooking(id: number, reason?: string): Promise<boolean> {
  try {
    await apiClient.post(`${API_BASE}/bookings/item/cancel`, {
      booking_id: id,
      cancel_reason: reason || "Normal Cancellation",
    });
    return true;
  } catch (e) {
    console.error("[API] cancelBooking failed", e);
    throw e;
  }
}

export async function checkInBooking(id: number): Promise<boolean> {
  try {
    await apiClient.post(`${API_BASE}/bookings/${id}/check-in`);
    return true;
  } catch (e) {
    console.error("[API] checkIn failed", e);
    throw e;
  }
}

export async function checkOutBooking(id: number): Promise<boolean> {
  try {
    await apiClient.post(`${API_BASE}/bookings/${id}/check-out`);
    return true;
  } catch (e) {
    console.error("[API] checkOut failed", e);
    throw e;
  }
}
