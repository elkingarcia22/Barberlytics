import * as React from "react";
import { DrawerShell } from "@/components/overlays";
import { useBookingFlow } from "./BookingContext";
import { DRAWER_FIT_STYLE } from "./drawerFit";

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Los botones del pie. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Las decisiones cortas de la reserva (cambiar de sede, para quién es, cancelar,
 * enviar el recibo): en celular, tablet y widget suben desde abajo, al alcance
 * del pulgar, como cualquier hoja de una app; en monitor entran por la derecha.
 * Un modal centrado se siente de escritorio dentro de una pantalla de celular.
 */
export function BookingSheet({ open, onOpenChange, title, description, actions, children }: BookingSheetProps) {
  const { layout } = useBookingFlow();
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      side={layout === "wide" ? "right" : "bottom"}
      contentStyle={DRAWER_FIT_STYLE}
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DrawerShell>
  );
}
