import type { Profile } from "@/lib/rpg/types";
import { cn } from "@/lib/utils";

export const AVATAR_ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB antes do redimensionamento
const OUTPUT_SIZE = 256;

/** Reads an image file, center-crops it square and resizes to 256px JPEG. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não suporta o recorte da imagem.");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileAvatar({
  profile,
  size = "md",
  className,
}: {
  profile: Pick<Profile, "avatarUrl" | "displayName">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "lg" ? "size-16 text-xl" : size === "sm" ? "size-8 text-sm" : "size-10 text-base";
  const initial = (profile.displayName ?? "?").trim().charAt(0).toUpperCase() || "?";
  return profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={profile.displayName ? `Foto de ${profile.displayName}` : "Foto de perfil"}
      className={cn("shrink-0 rounded-full object-cover shadow-border", dims, className)}
    />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-elevated font-display text-muted shadow-border",
        dims,
        className,
      )}
    >
      {initial}
    </span>
  );
}
