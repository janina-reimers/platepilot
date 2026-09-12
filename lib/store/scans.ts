import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MenuAnalysis, MenuLine } from '@/lib/analysis/types';
import type { CapturedPhoto } from '@/lib/capture';

export type Scan = {
  id: string;
  createdAt: string;
  /** Local file uri of the menu photo, when there was one. */
  photoUri?: string;
  /** What the user called this menu, usually the restaurant. */
  place: string;
  lines: MenuLine[];
  analysis: MenuAnalysis;
  /** How the dish names were obtained. */
  readerId: string;
};

type ScanState = {
  scans: Scan[];
  /** The photo currently being read, before the scan is saved. */
  draftPhoto?: CapturedPhoto;
  hydrated: boolean;
  setHydrated: () => void;
  setDraftPhoto: (photo: CapturedPhoto | undefined) => void;
  saveScan: (scan: Omit<Scan, 'id' | 'createdAt'>) => string;
  removeScan: (id: string) => void;
  clearHistory: () => void;
};

/** Past menu scans, stored on the device only. */
export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      scans: [],
      draftPhoto: undefined,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      setDraftPhoto: (photo) => set({ draftPhoto: photo }),

      saveScan: (scan) => {
        const id = `scan-${Date.now()}`;
        set((state) => ({
          scans: [{ ...scan, id, createdAt: new Date().toISOString() }, ...state.scans].slice(
            0,
            60,
          ),
          draftPhoto: undefined,
        }));
        return id;
      },

      removeScan: (id) => set((state) => ({ scans: state.scans.filter((scan) => scan.id !== id) })),

      clearHistory: () => set({ scans: [] }),
    }),
    {
      name: 'platepilot-scans',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scans: state.scans }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useScans(): Scan[] {
  return useScanStore((state) => state.scans);
}

export function useScan(id: string | undefined): Scan | undefined {
  return useScanStore((state) => (id ? state.scans.find((scan) => scan.id === id) : undefined));
}
