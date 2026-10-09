import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClipperOrb } from "./ClipperOrb";

export interface ClipperIconProps {
  /** Lado en px. Si se omite se lee de `size-N`, `h-N` o `size-[Npx]` en `className`; por defecto 16. */
  size?: number | string;
  className?: string;
  /** Se ignora: existe para ser intercambiable con los iconos de lucide (`strokeWidth`, `aria-hidden`…). */
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}

const DEFAULT_SIZE = 16;

/** `size-5` → 20, `h-4` → 16, `size-[18px]` → 18. Una clase de Tailwind de tamaño es 4 px por unidad. */
function sizeFromClass(className?: string): number | undefined {
  const match = className?.match(/(?:^|\s)(?:size|h)-(?:\[(\d+(?:\.\d+)?)px\]|(\d+(?:\.\d+)?))(?=\s|$)/);
  if (!match) return undefined;
  return match[1] ? Number(match[1]) : Number(match[2]) * 4;
}

/**
 * El orbe de Clipper con la forma de un icono de lucide (`icon: ClipperIcon`, `<ClipperIcon className="size-4" />`),
 * para los sitios que reciben o pintan un icono por clase. Es `ClipperOrb` sin halo ni anillo. Donde tengas el
 * tamaño en px usa `ClipperOrb` directamente.
 */
function ClipperIconImpl({ size, className }: ClipperIconProps) {
  return <ClipperOrb bare size={(typeof size === "number" ? size : undefined) ?? sizeFromClass(className) ?? DEFAULT_SIZE} className={cn("shrink-0 align-middle", className)} />;
}

/** Tipado como `LucideIcon` para poder ir donde se espera un icono de lucide (`icon: ClipperIcon`). */
export const ClipperIcon = ClipperIconImpl as unknown as LucideIcon;
