import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { MenuLink } from "./writeChannels";

/**
 * Escribirle al cliente por SMS o por correo (2026-10-18: la barbería no usa
 * WhatsApp desde la agenda). Con los dos a mano se elige en un menú; con uno
 * solo, el enlace va directo.
 */

/** El menú de canales bajo lo que lo abre (un atajo o un botón). */
export function LinkMenu({ items, children, align = "center" }: { items: readonly MenuLink[]; children: React.ReactElement; align?: "start" | "center" | "end" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        {items.map((item) => (
          <DropdownMenuItem key={item.id} asChild>
            <a href={item.href} target="_blank" rel="noreferrer" data-testid={`panel-write-${item.id}`}>
              {item.icon}
              {item.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
