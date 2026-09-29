import type { Character, Profile } from "./types";

export type RpgState = { profile: Profile | null; character: Character | null; party: Character[] };
