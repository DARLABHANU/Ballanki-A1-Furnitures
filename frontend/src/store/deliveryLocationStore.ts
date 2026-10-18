import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeliveryLocation {
  pincode: string;
  city: string;
  district: string;
  state: string;
  source?: "device" | "manual";
  approximate?: boolean;
}

interface DeliveryLocationStore {
  location: DeliveryLocation | null;
  detectedLocation: DeliveryLocation | null;
  setDetectedLocation: (loc: DeliveryLocation) => void;
  isDetecting: boolean;
  detectionError: string;
  setDetection: (busy: boolean, error?: string) => void;
  setLocation: (loc: DeliveryLocation) => void;
  clearLocation: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationStore>()(
  persist(
    (set) => ({
      location: null,
      detectedLocation: null,
      setDetectedLocation: (detectedLocation) => set({ detectedLocation, isModalOpen: true }),
      isDetecting: false,
      detectionError: "",
      setDetection: (isDetecting, detectionError = "") => set({ isDetecting, detectionError }),
      setLocation: (loc) => set({ location: loc, detectedLocation: null }),
      clearLocation: () => set({ location: null }),
      isModalOpen: false,
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false, detectedLocation: null }),
    }),
    {
      name: "ballanki-a1-furnitures-delivery-location", // persists to localStorage
      merge: (persisted, current) => {
        const saved = (persisted as {location?: DeliveryLocation})?.location;
        return {...current, location: saved?.source === "device" && saved.approximate ? null : saved || null};
      },
      partialize: (state) => ({ location: state.location }), // Only persist location, not modal state
    }
  )
);
