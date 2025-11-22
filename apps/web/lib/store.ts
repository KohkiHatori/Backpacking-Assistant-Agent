import { create } from "zustand";

interface TripState {
  step: number;
  destinations: string[];
  startPoint: string;
  endPoint: string;
  startDate: Date | null;
  endDate: Date | null;
  flexibleDates: boolean;
  adultsCount: number;
  childrenCount: number;
  preferences: string[];
  transportation: string[];
  budget: number;
  currency: string;

  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setField: (field: keyof TripState, value: any) => void;
  resetForm: () => void;
}

const initialState = {
  step: 0,
  destinations: [],
  startPoint: "",
  endPoint: "",
  startDate: null,
  endDate: null,
  flexibleDates: false,
  adultsCount: 1,
  childrenCount: 0,
  preferences: [],
  transportation: [],
  budget: 1000,
  currency: "USD",
};

export const useStore = create<TripState>((set) => ({
  ...initialState,

  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  setStep: (step: number) => set({ step }),
  setField: (field, value) => set({ [field]: value }),
  resetForm: () => set(initialState),
}));
