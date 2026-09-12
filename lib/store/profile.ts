import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createCustomAvoid } from '@/lib/analysis/profile';
import {
  EMPTY_PROFILE,
  type CustomAvoid,
  type Profile,
  type ProfileIntolerance,
  type Strictness,
} from '@/lib/analysis/types';
import { INTOLERANCES_BY_ID } from '@/lib/data/triggers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCustomAvoid(value: unknown): value is CustomAvoid {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    Array.isArray(value.matchedIngredientIds) &&
    value.matchedIngredientIds.every((id) => typeof id === 'string')
  );
}

type ProfileState = {
  profile: Profile;
  hydrated: boolean;
  setHydrated: () => void;
  toggleIntolerance: (id: string) => void;
  setStrictness: (id: string, strictness: Strictness) => void;
  addCustomAvoid: (text: string) => void;
  removeCustomAvoid: (id: string) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

/**
 * The user's profile. Kept on the device only, in AsyncStorage, so nothing
 * about someone's health leaves their phone.
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: EMPTY_PROFILE,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      toggleIntolerance: (id) =>
        set((state) => {
          const exists = state.profile.intolerances.some((item) => item.id === id);
          return {
            profile: {
              ...state.profile,
              intolerances: exists
                ? state.profile.intolerances.filter((item) => item.id !== id)
                : [...state.profile.intolerances, { id, strictness: 'strict' }],
            },
          };
        }),

      setStrictness: (id, strictness) =>
        set((state) => ({
          profile: {
            ...state.profile,
            intolerances: state.profile.intolerances.map((item) =>
              item.id === id ? { ...item, strictness } : item,
            ),
          },
        })),

      addCustomAvoid: (text) =>
        set((state) => {
          const trimmed = text.trim();
          if (trimmed.length < 2) return state;
          const avoid = createCustomAvoid(trimmed);
          if (state.profile.customAvoids.some((item) => item.id === avoid.id)) return state;
          return {
            profile: { ...state.profile, customAvoids: [...state.profile.customAvoids, avoid] },
          };
        }),

      removeCustomAvoid: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            customAvoids: state.profile.customAvoids.filter((item) => item.id !== id),
          },
        })),

      completeOnboarding: () =>
        set((state) => ({ profile: { ...state.profile, onboarded: true } })),

      reset: () => set({ profile: { ...EMPTY_PROFILE, onboarded: true } }),
    }),
    {
      name: 'platepilot-profile',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
      /**
       * Older profiles could hold conditions and allergen entries that the app
       * no longer offers. Drop anything we cannot check against any more, so a
       * profile never claims to be watching something it is not.
       */
      migrate: (persisted) => {
        const stored = isRecord(persisted) ? persisted : {};
        const profile = isRecord(stored.profile) ? stored.profile : {};
        const rawIntolerances = Array.isArray(profile.intolerances) ? profile.intolerances : [];
        const rawCustomAvoids = Array.isArray(profile.customAvoids) ? profile.customAvoids : [];
        const intolerances: ProfileIntolerance[] = [];
        for (const item of rawIntolerances) {
          if (!isRecord(item) || typeof item.id !== 'string') continue;
          if (INTOLERANCES_BY_ID[item.id] === undefined) continue;
          intolerances.push({
            id: item.id,
            strictness: item.strictness === 'small-amounts' ? 'small-amounts' : 'strict',
          });
        }
        return {
          profile: {
            intolerances,
            customAvoids: rawCustomAvoids.filter(isCustomAvoid),
            onboarded: Boolean(profile.onboarded),
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useProfile(): Profile {
  return useProfileStore((state) => state.profile);
}

export function useProfileHydrated(): boolean {
  return useProfileStore((state) => state.hydrated);
}

/** True once the user has told us something we can actually check against. */
export function hasProfileContent(profile: Profile): boolean {
  return profile.intolerances.length > 0 || profile.customAvoids.length > 0;
}
