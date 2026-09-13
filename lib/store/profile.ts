import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createCustomAvoid } from '@/lib/analysis/profile';
import {
  EMPTY_PROFILE,
  type CustomAvoid,
  type Profile,
  type ProfileColor,
  type ProfileIntolerance,
  type Strictness,
} from '@/lib/analysis/types';
import { INTOLERANCES_BY_ID } from '@/lib/data/triggers';

const PROFILE_COLORS: ProfileColor[] = ['teal', 'blue', 'violet', 'orange', 'rose', 'green'];

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

function validColor(value: unknown, fallback: ProfileColor): ProfileColor {
  return PROFILE_COLORS.find((color) => color === value) ?? fallback;
}

function cleanProfile(value: unknown, index: number, onboardedFallback = false): Profile {
  const raw = isRecord(value) ? value : {};
  const rawIntolerances = Array.isArray(raw.intolerances) ? raw.intolerances : [];
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
    id:
      typeof raw.id === 'string'
        ? raw.id
        : index === 0
          ? 'profile-default'
          : `profile-${index + 1}`,
    name: typeof raw.name === 'string' ? raw.name.slice(0, 40) : '',
    color: validColor(raw.color, PROFILE_COLORS[index % PROFILE_COLORS.length]),
    intolerances,
    customAvoids: (Array.isArray(raw.customAvoids) ? raw.customAvoids : []).filter(isCustomAvoid),
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : onboardedFallback,
  };
}

type ProfileState = {
  /** Compatibility alias for the active profile. */
  profile: Profile;
  profiles: Profile[];
  activeProfileId: string;
  hydrated: boolean;
  setHydrated: () => void;
  setActiveProfile: (id: string) => void;
  createProfile: () => string;
  updateProfileMeta: (name: string, color?: ProfileColor) => void;
  removeActiveProfile: () => void;
  toggleIntolerance: (id: string) => void;
  setStrictness: (id: string, strictness: Strictness) => void;
  addCustomAvoid: (text: string) => void;
  removeCustomAvoid: (id: string) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

function updateActive(
  state: Pick<ProfileState, 'profiles' | 'activeProfileId' | 'profile'>,
  update: (profile: Profile) => Profile,
): Pick<ProfileState, 'profiles' | 'profile'> {
  const profile = update(state.profile);
  return {
    profile,
    profiles: state.profiles.map((item) => (item.id === state.activeProfileId ? profile : item)),
  };
}

/** Food Profiles stay on this device in AsyncStorage. */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: EMPTY_PROFILE,
      profiles: [EMPTY_PROFILE],
      activeProfileId: EMPTY_PROFILE.id,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      setActiveProfile: (id) =>
        set((state) => {
          const profile = state.profiles.find((item) => item.id === id);
          return profile ? { activeProfileId: id, profile } : state;
        }),

      createProfile: () => {
        const id = `profile-${Date.now()}`;
        const state = get();
        const profile: Profile = {
          ...EMPTY_PROFILE,
          id,
          color: PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
          onboarded: true,
        };
        set({ profiles: [...state.profiles, profile], activeProfileId: id, profile });
        return id;
      },

      updateProfileMeta: (name, color) =>
        set((state) =>
          updateActive(state, (profile) => ({
            ...profile,
            name: name.slice(0, 40),
            color: color ?? profile.color,
          })),
        ),

      removeActiveProfile: () =>
        set((state) => {
          if (state.profiles.length <= 1) return state;
          const profiles = state.profiles.filter((item) => item.id !== state.activeProfileId);
          return { profiles, activeProfileId: profiles[0].id, profile: profiles[0] };
        }),

      toggleIntolerance: (id) =>
        set((state) =>
          updateActive(state, (profile) => {
            const exists = profile.intolerances.some((item) => item.id === id);
            return {
              ...profile,
              intolerances: exists
                ? profile.intolerances.filter((item) => item.id !== id)
                : [...profile.intolerances, { id, strictness: 'strict' }],
            };
          }),
        ),

      setStrictness: (id, strictness) =>
        set((state) =>
          updateActive(state, (profile) => ({
            ...profile,
            intolerances: profile.intolerances.map((item) =>
              item.id === id ? { ...item, strictness } : item,
            ),
          })),
        ),

      addCustomAvoid: (text) =>
        set((state) => {
          const trimmed = text.trim();
          if (trimmed.length < 2) return state;
          const avoid = createCustomAvoid(trimmed);
          if (state.profile.customAvoids.some((item) => item.id === avoid.id)) return state;
          return updateActive(state, (profile) => ({
            ...profile,
            customAvoids: [...profile.customAvoids, avoid],
          }));
        }),

      removeCustomAvoid: (id) =>
        set((state) =>
          updateActive(state, (profile) => ({
            ...profile,
            customAvoids: profile.customAvoids.filter((item) => item.id !== id),
          })),
        ),

      completeOnboarding: () =>
        set((state) => updateActive(state, (profile) => ({ ...profile, onboarded: true }))),

      reset: () =>
        set((state) =>
          updateActive(state, (profile) => ({
            ...profile,
            intolerances: [],
            customAvoids: [],
            onboarded: true,
          })),
        ),
    }),
    {
      name: 'platepilot-profile',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        profile: state.profile,
      }),
      migrate: (persisted) => {
        const stored = isRecord(persisted) ? persisted : {};
        const legacy = isRecord(stored.profile) ? stored.profile : {};
        const rawProfiles = Array.isArray(stored.profiles) ? stored.profiles : [legacy];
        const profiles = rawProfiles.map((item, index) =>
          cleanProfile(item, index, Boolean(legacy.onboarded)),
        );
        const usableProfiles = profiles.length > 0 ? profiles : [EMPTY_PROFILE];
        const requestedId =
          typeof stored.activeProfileId === 'string' ? stored.activeProfileId : '';
        const profile = usableProfiles.find((item) => item.id === requestedId) ?? usableProfiles[0];
        return { profiles: usableProfiles, activeProfileId: profile.id, profile };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function useProfile(): Profile {
  return useProfileStore((state) => state.profile);
}

export function useProfiles(): Profile[] {
  return useProfileStore((state) => state.profiles);
}

export function useProfileHydrated(): boolean {
  return useProfileStore((state) => state.hydrated);
}

export function profileDisplayName(profile: Profile, index: number): string {
  return profile.name.trim() || `Profile ${index + 1}`;
}

/** True once the user has told us something we can actually check against. */
export function hasProfileContent(profile: Profile): boolean {
  return profile.intolerances.length > 0 || profile.customAvoids.length > 0;
}
