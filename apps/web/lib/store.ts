import { create } from "zustand";

interface TripState {
  step: number;
  destinations: string[];
  startPoint: string;
  endPoint: string;
  startDate: Date | null;
  endDate: Date | null;
  flexibleDates: boolean;
  preferences: string[];
  transportation: string[];
  budget: number;
  currency: string;

  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setField: (field: keyof TripState, value: any) => void;
}

export const useStore = create<TripState>((set) => ({
  step: 0,
  destinations: [],
  startPoint: "",
  endPoint: "",
  startDate: null,
  endDate: null,
  flexibleDates: false,
  preferences: [],
  transportation: [],
  budget: 1000,
  currency: "USD",

  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  setStep: (step: number) => set({ step }),
  setField: (field, value) => set({ [field]: value }),
}));
