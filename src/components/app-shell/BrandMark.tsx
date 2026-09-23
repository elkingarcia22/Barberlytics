import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  /** El nombre del producto; de ahí sale la inicial. */
  name: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * La marca del producto en el menú: la inicial sobre el color del tema.
 *
 * Es identidad, no un selector. El espacio de trabajo (empresa, sucursal) se
 * cambia desde la cabecera; aquí arriba solo se dice de qué producto es esta
 * pantalla, que es lo único que no cambia nunca.
 */
export function BrandMark({ name, size = "md", className }: BrandMarkProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary font-extrabold text-primary-foreground",
        size === "md" ? "size-8 text-sm" : "size-6 text-[11px]",
        className
      )}
    >
      {initial}
    </span>
  );
}
