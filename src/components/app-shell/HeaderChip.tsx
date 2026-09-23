import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeaderChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** La marca o el icono que abre el chip: dice el tipo sin necesitar texto. */
  leading: React.ReactNode;
  /** El dato en sí: el nombre de la sucursal, el rol activo. */
  value: string;
  /**
   * El segundo dato del mismo contexto, cuando el chip carga dos: la sucursal
   * dice dónde estás y `meta` como quién. Se lee en la misma línea, separado
   * por un punto y con menos peso, y es lo primero que se pliega cuando la
   * cabecera se estrecha.
   */
  meta?: string;
  /** Para lectores de pantalla y el `title`; el tipo ya no se escribe aquí arriba. */
  srLabel: string;
  open?: boolean;
}

/**
 * El chip de contexto de la cabecera: dónde estás y como quién.
 *
 * Una sola línea, no dos renglones apretados: antes cada chip cargaba un
 * rótulo diminuto ("SUCURSAL") encima del valor, y a 36px de alto el
 * conjunto —marca, dos líneas de texto, flecha— se leía apretujado. El color
 * de la marca dice el tipo de un vistazo; el rótulo completo se lee dentro,
 * en la cabecera del menú que abre (`CompanyMenu`, `RoleMenu`), donde sí hay
 * sitio para una frase. Por debajo de `sm` el texto se pliega y el chip se
 * queda en la marca sola: sigue siendo el mismo botón, solo más pequeño.
 */
export const HeaderChip = React.forwardRef<HTMLButtonElement, HeaderChipProps>(function HeaderChip(
  { leading, value, meta, srLabel, open, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={srLabel}
      title={srLabel}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-left transition-colors",
        meta ? "max-w-[300px]" : "max-w-[172px]",
        "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "max-sm:w-9 max-sm:max-w-none max-sm:justify-center max-sm:gap-0 max-sm:p-0.5",
        open && "bg-surface-muted",
        className
      )}
      {...props}
    >
      {leading}
      <span className="flex min-w-0 flex-1 items-center gap-1.5 max-sm:hidden">
        <span className="min-w-0 truncate text-[13px] font-semibold text-text-primary">{value}</span>
        {meta && (
          <>
            <span aria-hidden className="text-[13px] text-text-muted max-md:hidden">
              ·
            </span>
            <span className="min-w-0 truncate text-[12px] font-medium text-text-muted max-md:hidden">{meta}</span>
          </>
        )}
      </span>
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0 text-text-muted transition-transform duration-200 max-sm:hidden",
          open && "rotate-180"
        )}
        strokeWidth={2.5}
      />
    </button>
  );
});
