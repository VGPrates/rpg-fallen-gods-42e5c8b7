import sword from "@/assets/icons/sword.webp";
import dagger from "@/assets/icons/dagger.webp";
import axe from "@/assets/icons/axe.webp";
import bow from "@/assets/icons/bow.webp";
import shield from "@/assets/icons/shield.webp";
import helmet from "@/assets/icons/helmet.webp";
import armor from "@/assets/icons/armor.webp";
import pants from "@/assets/icons/pants.webp";
import boot from "@/assets/icons/boot.webp";
import ring from "@/assets/icons/ring.webp";
import potion from "@/assets/icons/potion.webp";
import scroll from "@/assets/icons/scroll.webp";
import bag from "@/assets/icons/bag.webp";
import gem from "@/assets/icons/gem.webp";
import muscle from "@/assets/icons/muscle.webp";
import aegis from "@/assets/icons/aegis.webp";
import sparkles from "@/assets/icons/sparkles.webp";
import flame from "@/assets/icons/flame.webp";
import frost from "@/assets/icons/frost.webp";
import heart from "@/assets/icons/heart.webp";
import droplet from "@/assets/icons/droplet.webp";
import blood from "@/assets/icons/blood.webp";
import bone from "@/assets/icons/bone.webp";
import stun from "@/assets/icons/stun.webp";
import poison from "@/assets/icons/poison.webp";
import wilt from "@/assets/icons/wilt.webp";

/**
 * One painted icon set, split in three shelves so the picker never shows
 * everything at once: gear, buffs/debuffs and conditions.
 * Keys are stable — stored icon names keep working.
 */
export type IconCategory = "equipment" | "effect" | "condition";

export const ICON_CATEGORIES: { key: IconCategory; label: string }[] = [
  { key: "equipment", label: "Equipamentos" },
  { key: "effect", label: "Buffs e Debuffs" },
  { key: "condition", label: "Condições" },
];

export const ICON_CATEGORY_LABEL: Record<IconCategory, string> = {
  equipment: "Equipamento",
  effect: "Buff / Debuff",
  condition: "Condição",
};

export type IconEntry = {
  key: string;
  label: string;
  category: IconCategory;
  src: string;
  custom?: boolean;
};

export const BUILTIN_ICONS: IconEntry[] = [
  { key: "sword", label: "Espada", category: "equipment", src: sword },
  { key: "dagger", label: "Adaga", category: "equipment", src: dagger },
  { key: "axe", label: "Machado", category: "equipment", src: axe },
  { key: "bow", label: "Arco", category: "equipment", src: bow },
  { key: "shield", label: "Escudo", category: "equipment", src: shield },
  { key: "helmet", label: "Elmo", category: "equipment", src: helmet },
  { key: "armor", label: "Armadura", category: "equipment", src: armor },
  { key: "pants", label: "Grevas", category: "equipment", src: pants },
  { key: "boot", label: "Bota", category: "equipment", src: boot },
  { key: "ring", label: "Anel", category: "equipment", src: ring },
  { key: "potion", label: "Poção", category: "equipment", src: potion },
  { key: "scroll", label: "Pergaminho", category: "equipment", src: scroll },
  { key: "bag", label: "Bolsa", category: "equipment", src: bag },
  { key: "gem", label: "Gema", category: "equipment", src: gem },
  { key: "muscle", label: "Vigor", category: "effect", src: muscle },
  { key: "aegis", label: "Proteção", category: "effect", src: aegis },
  { key: "sparkles", label: "Arcano", category: "effect", src: sparkles },
  { key: "flame", label: "Chama", category: "effect", src: flame },
  { key: "frost", label: "Gelo", category: "effect", src: frost },
  { key: "heart", label: "Vida", category: "effect", src: heart },
  { key: "droplet", label: "Gota", category: "effect", src: droplet },
  { key: "blood", label: "Sangramento", category: "condition", src: blood },
  { key: "bone", label: "Fratura", category: "condition", src: bone },
  { key: "stun", label: "Atordoado", category: "condition", src: stun },
  { key: "poison", label: "Veneno", category: "condition", src: poison },
  { key: "wilt", label: "Definhar", category: "condition", src: wilt },
];

export const FALLBACK_ICON = sparkles;

const builtinIconByKey = new Map(BUILTIN_ICONS.map((icon) => [icon.key, icon]));

/* ---------- custom icons imported by the GM ---------- */

let customIcons: IconEntry[] = [];
let customIconByKey = new Map<string, IconEntry>();
let hiddenBuiltinKeys = new Set<string>();
const listeners = new Set<() => void>();

export function getCustomIcons() {
  return customIcons;
}

export function subscribeCustomIcons(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

function setCustomIcons(next: IconEntry[]) {
  customIcons = next;
  customIconByKey = new Map(next.map((icon) => [icon.key, icon]));
  notify();
}

function setHiddenBuiltinKeys(next: Set<string>) {
  hiddenBuiltinKeys = next;
  notify();
}

export function isBuiltinIcon(key: string) {
  return builtinIconByKey.has(key);
}

export function resolveIconSrc(name: string | null | undefined) {
  const key = name ?? "";
  if (hiddenBuiltinKeys.has(key)) return FALLBACK_ICON;
  return builtinIconByKey.get(key)?.src ?? customIconByKey.get(key)?.src ?? FALLBACK_ICON;
}

export function allIcons(): IconEntry[] {
  return [...BUILTIN_ICONS.filter((icon) => !hiddenBuiltinKeys.has(icon.key)), ...customIcons];
}

export function iconLabel(name: string | null | undefined) {
  const key = name ?? "";
  return builtinIconByKey.get(key)?.label ?? customIconByKey.get(key)?.label ?? key;
}

export async function fetchCustomIcons(): Promise<IconEntry[]> {
  return getCustomIcons();
}

export async function createCustomIcon(input: {
  label: string;
  category: IconCategory;
  dataUrl: string;
}) {
  const key = `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  setCustomIcons([
    ...customIcons,
    { key, label: input.label.slice(0, 40), category: input.category, src: input.dataUrl, custom: true },
  ]);
  return key;
}

export async function deleteCustomIcon(key: string) {
  if (builtinIconByKey.has(key)) {
    setHiddenBuiltinKeys(new Set([...hiddenBuiltinKeys, key]));
    return;
  }
  setCustomIcons(customIcons.filter((icon) => icon.key !== key));
}

/** Standard icon canvas: square, centered, with the same visual breathing room as built-ins. */
export const ICON_SIZE = 256;
const ICON_CONTENT_SIZE = 224;

export async function normalizeIconFile(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
      el.src = bitmapUrl;
    });
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.naturalWidth;
    sourceCanvas.height = img.naturalHeight;
    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) throw new Error("Não foi possível processar a imagem.");
    sourceCtx.drawImage(img, 0, 0);

    // Trim transparent margins first, then fit the visible art into a padded
    // square. Opaque photos keep their full frame. Neither path distorts it.
    const pixels = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    let left = sourceCanvas.width;
    let top = sourceCanvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < sourceCanvas.height; y += 1) {
      for (let x = 0; x < sourceCanvas.width; x += 1) {
        if ((pixels[(y * sourceCanvas.width + x) * 4 + 3] ?? 0) > 12) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    if (right < left || bottom < top) throw new Error("A imagem está vazia.");

    const sourceWidth = right - left + 1;
    const sourceHeight = bottom - top + 1;
    const scale = Math.min(ICON_CONTENT_SIZE / sourceWidth, ICON_CONTENT_SIZE / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const drawX = (ICON_SIZE - drawWidth) / 2;
    const drawY = (ICON_SIZE - drawHeight) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      sourceCanvas,
      left,
      top,
      sourceWidth,
      sourceHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );
    const dataUrl = canvas.toDataURL("image/webp", 0.76);
    return dataUrl.startsWith("data:image/webp") ? dataUrl : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}
