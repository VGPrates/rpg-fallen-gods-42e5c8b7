import { useEffect, useState, useSyncExternalStore, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  BUILTIN_ICONS,
  allIcons,
  getCustomIcons,
  iconLabel,
  resolveIconSrc,
  subscribeCustomIcons,
} from "@/lib/rpg/icons";

/**
 * Illustrated medieval/fantasy icon set for RPG Fallen Gods.
 * No emoji anywhere in the UI — every pictogram comes from this single set
 * (built-in shelves plus icons the GM imported) so buttons, slots, library
 * entries and effects share one painted visual identity.
 */
export type GameIconName = string;

export const GAME_ICON_NAMES = BUILTIN_ICONS.map((i) => i.key);

export const GAME_ICON_LABEL: Record<string, string> = Object.fromEntries(
  BUILTIN_ICONS.map((i) => [i.key, i.label]),
);

export { iconLabel };

/** Re-renders consumers whenever the GM's imported icons change. */
export function useIconRegistry() {
  useSyncExternalStore(
    subscribeCustomIcons,
    getCustomIcons,
    () => getCustomIcons(),
  );
  return allIcons();
}

function useIconSrc(name: string | null | undefined) {
  return useSyncExternalStore(
    subscribeCustomIcons,
    () => resolveIconSrc(name),
    () => resolveIconSrc(name),
  );
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "name" | "src" | "alt"> & {
  name: string | null | undefined;
  className?: string;
  title?: string;
  /** Rarity key (comum | incomum | raro | epico | lendario) for an elegant tinted glow. */
  rarity?: string | null;
  /** Dim the icon (used for empty equipment slots). */
  muted?: boolean;
};

export function GameIcon({ name, className, title, rarity, muted, ...rest }: Props) {
  const src = useIconSrc(name);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  useEffect(() => {
    const image = new Image();
    image.src = src;
    if (image.complete) setLoadedSrc(src);
  }, [src]);

  return (
    <img
      src={src}
      alt={title ?? ""}
      title={title}
      loading="eager"
      decoding="async"
      onLoad={() => setLoadedSrc(src)}
      draggable={false}
      data-game-icon=""
      className={cn(
        "fantasy-icon size-7 shrink-0 object-contain select-none",
        loaded ? "fantasy-icon--loaded" : "fantasy-icon--loading",
        rarity ? `fantasy-icon--${rarity}` : null,
        muted ? "fantasy-icon--muted" : null,
        className,
      )}
      aria-hidden={title ? undefined : true}
      {...rest}
    />
  );
}
