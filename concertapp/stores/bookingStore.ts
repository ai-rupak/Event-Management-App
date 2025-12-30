import { create } from "zustand";

interface Ticket {
  sectionId: string;
  name: string;
  price: number;
  quantity: number;
  
}

interface BookingState {
  tickets: Ticket[];
  addTicket: (
    sectionId: string,
    name: string,
    price: number,
    quantity?: number
  ) => void; // Optional quantity
  removeTicket: (sectionId: string) => void;
  updateQuantity: (sectionId: string, quantity: number) => void;
  getTotal: () => number;
  clearCart: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  tickets: [],
  addTicket: (sectionId, name, price, quantity = 1) =>
    set((state) => ({
      tickets: [
        ...state.tickets.filter((t) => t.sectionId !== sectionId),
        { sectionId, name, price, quantity },
      ],
    })),
  removeTicket: (sectionId) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.sectionId !== sectionId),
    })),
  updateQuantity: (sectionId, quantity) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.sectionId === sectionId
          ? { ...t, quantity: Math.max(0, quantity) }
          : t
      ),
    })),
  getTotal: () =>
    get().tickets.reduce((sum, t) => sum + t.price * t.quantity, 0),
  clearCart: () => set({ tickets: [] }),
}));
