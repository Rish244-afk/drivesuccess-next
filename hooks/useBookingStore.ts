import { create } from 'zustand';

interface BookingState {
  selectedCourseId: string | null;
  selectedVehicleId: string | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  step: number;
  setSelectedCourseId: (id: string | null) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTimeSlot: (slot: string | null) => void;
  setStep: (step: number) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedCourseId: null,
  selectedVehicleId: null,
  selectedDate: null,
  selectedTimeSlot: null,
  step: 1,
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
  setStep: (step) => set({ step }),
  resetBooking: () =>
    set({
      selectedCourseId: null,
      selectedVehicleId: null,
      selectedDate: null,
      selectedTimeSlot: null,
      step: 1,
    }),
}));
