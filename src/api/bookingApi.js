import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 🔑 ADD TOKEN HERE
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // make sure this exists

  if (token) {
    config.headers.Authorization = `Bearer ${import.meta.env.VITE_API_TOKEN}`;
  }

  return config;
});

// ✅ GET THERAPISTS
export const getTherapists = async (date) => {
  try {
    const response = await API.get("/therapists", {
      params: {
        availability: 1,
        outlet: 1,
        service_at: date,
        services: 1,
        status: 1,
        pagination: 0,
        panel: "outlet",
        outlet_type: 2,
        leave: 0,
      },
    });

    // console.log("THERAPISTS API:", response.data?.data?.data?.list?.staffs);

    // ✅ CORRECT PATH (THIS WAS WRONG BEFORE)
    return response.data?.data?.data?.list?.staffs || [];
  } catch (error) {
    console.error("Therapists API error:", error);
    return [];
  }
};

const formatDateRange = (date) => {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  // 🔥 SAME DAY RANGE
  return `${day}-${month}-${year} / ${day}-${month}-${year}`;
};

// ✅ GET BOOKINGS
export const getBookings = async (date) => {
  try {
    // 🔥 convert date → correct format
    const formattedDate = formatDateRange(date);

    const response = await API.get("/bookings/outlet/booking/list", {
      params: {
        pagination: 1,
        daterange: formattedDate,
        outlet: 1,
        panel: "outlet",
        view_type: "calendar",
      },
    });

    return response.data?.data?.data?.list?.bookings || [];
  } catch (error) {
    console.error("Bookings API error:", error);
    return [];
  }
};
