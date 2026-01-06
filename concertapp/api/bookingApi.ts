import api from "./api";

export const createBooking = async (data: {
  categoryId: string;
  seats: number;
}) => {
  const response = await api.post("/booking", data);
  return response.data;
};

export const confirmBooking = async (bookingId: string) => {
  const response = await api.patch(`/booking/${bookingId}/confirm`);
  return response.data;
};

export const getPendingBooking = async (categoryId: string) => {
  if (!categoryId) throw new Error("CategoryId Required");
  const response = await api.get(`/booking/pending?categoryId=${categoryId}`);
  return response.data;
};

export const cancelPendingBooking = async (categoryId: string) => {
  const response = await api.delete(
    `/booking/pending?categoryId=${categoryId}`
  );
  return response.data;
};


export const getConfirmedBooking = async (bookingId: string) => {
  if (!bookingId) throw new Error("bookingId required");
  const response = await api.get(`/booking/confirmed/${bookingId}`);
  return response.data;
};

export const getUserBookings = async () => {
  const response = await api.get("/booking/mine");
  return response.data;
};