import {
  Bell,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarOff,
  CalendarRange,
  CreditCard,
  FileText,
  HandCoins,
  KeyRound,
  Landmark,
  Percent,
  Plug,
  ReceiptText,
  Smartphone,
  Stamp,
  Store,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { IconTileProps } from "@/components/utility";

/**
 * El icono y el color de cada ajuste. El tono va por grupo, no por ítem: el
 * color dice de qué parte se está hablando (el negocio, el cobro, lo que se
 * le paga al equipo, la cuenta) y el glifo, qué se ajusta dentro de esa parte.
 * Lo irreversible es la excepción: va en rojo aunque su grupo no lo sea.
 *
 * Son iconos de `lucide-react` porque el registro de Thema (Hugeicons) todavía
 * no tiene conceptos como propina, datáfono o comisión; el registro manda en
 * cuanto los tenga.
 */
export const SETTINGS_ICONS: Record<string, LucideIcon> = {
  negocio: Store,
  identidad: Stamp,
  facturacion: FileText,
  agendamiento: CalendarClock,
  "agendamiento-online": CalendarCheck,
  cierres: CalendarOff,
  dispositivos: Smartphone,
  sucursales: Building2,
  empresa: Landmark,
  nomina: CalendarRange,
  comisiones: Percent,
  impuestos: ReceiptText,
  "tarifa-tarjeta": CreditCard,
  propinas: HandCoins,
  precios: Tag,
  pagos: Plug,
  "centro-notificaciones": Bell,
  preferencias: SlidersHorizontal,
  "inicio-sesion": KeyRound,
  permisos: ShieldCheck,
  "eliminar-cuenta": Trash2,
};

export const SETTINGS_GROUP_TONES: Record<string, IconTileProps["tone"]> = {
  negocio: "primary",
  cobros: "positive",
  "pagos-equipo": "info",
  cuenta: "warning",
};
