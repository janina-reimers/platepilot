import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DishAnalysis, MenuAnalysis, MenuLine, ProfileColor } from '@/lib/analysis/types';
import type { CapturedPhoto } from '@/lib/capture';

export type ScanProfile = { id: string; name: string; color: ProfileColor };

export type Scan = {
  id: string;
  createdAt: string;
  photoUris?: string[];
  photoUri?: string;
  place: string;
  lines: MenuLine[];
  analysis: MenuAnalysis;
  readerId: string;
  /** Frozen labels for the profiles used to create this result. */
  profiles?: ScanProfile[];
};

export type FavoriteDish = {
  id: string;
  createdAt: string;
  scanId: string;
  lineId: string;
  place: string;
  dish: DishAnalysis;
  profiles?: ScanProfile[];
};

type ScanState = {
  scans: Scan[];
  favorites: FavoriteDish[];
  draftPhotos: CapturedPhoto[];
  /** Two or more ids means the next scan is a Dining Together scan. */
  draftProfileIds: string[];
  hydrated: boolean;
  setHydrated: () => void;
  setDraftPhotos: (photos: CapturedPhoto[]) => void;
  setDraftProfileIds: (ids: string[]) => void;
  saveScan: (scan: Omit<Scan, 'id' | 'createdAt'>) => string;
  removeScan: (id: string) => void;
  clearHistory: () => void;
  toggleFavorite: (scanId: string, lineId: string) => void;
};

/** Past scans and favorite dish snapshots, stored on the device only. */
export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      scans: [],
      favorites: [],
      draftPhotos: [],
      draftProfileIds: [],
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),
      setDraftPhotos: (photos) => set({ draftPhotos: photos }),
      setDraftProfileIds: (ids) => set({ draftProfileIds: [...new Set(ids)] }),

      saveScan: (scan) => {
        const id = `scan-${Date.now()}`;
        set((state) => ({
          scans: [{ ...scan, id, createdAt: new Date().toISOString() }, ...state.scans].slice(
            0,
            60,
          ),
          draftPhotos: [],
          draftProfileIds: [],
        }));
        return id;
      },

      removeScan: (id) => set((state) => ({ scans: state.scans.filter((scan) => scan.id !== id) })),
      clearHistory: () => set({ scans: [] }),

      toggleFavorite: (scanId, lineId) =>
        set((state) => {
          const id = `${scanId}:${lineId}`;
          if (state.favorites.some((favorite) => favorite.id === id)) {
            return { favorites: state.favorites.filter((favorite) => favorite.id !== id) };
          }
          const scan = state.scans.find((item) => item.id === scanId);
          const dish = scan?.analysis.dishes.find((item) => item.lineId === lineId);
          if (!scan || !dish) return state;
          return {
            favorites: [
              {
                id,
                createdAt: new Date().toISOString(),
                scanId,
                lineId,
                place: scan.place,
                dish,
                profiles: scan.profiles,
              },
              ...state.favorites,
            ],
          };
        }),
    }),
    {
      name: 'platepilot-scans',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scans: state.scans, favorites: state.favorites }),
      migrate: (persisted) => {
        const stored =
          typeof persisted === 'object' && persisted !== null
            ? (persisted as Partial<ScanState>)
            : {};
        return {
          scans: Array.isArray(stored.scans) ? stored.scans : [],
          favorites: Array.isArray(stored.favorites) ? stored.favorites : [],
        };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function useScans(): Scan[] {
  return useScanStore((state) => state.scans);
}

export function useScan(id: string | undefined): Scan | undefined {
  return useScanStore((state) => (id ? state.scans.find((scan) => scan.id === id) : undefined));
}

export function useFavorites(): FavoriteDish[] {
  return useScanStore((state) => state.favorites);
}
