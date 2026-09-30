import type * as React from "react";

/**
 * El modelo que comparten las piezas de agenda: quién atiende (un recurso,
 * en la barbería un barbero), qué pasa en su columna (una cita o un bloqueo)
 * y con qué tono se pinta. Es deliberadamente agnóstico del dominio: la
 * pantalla traduce sus citas a esto y las piezas no saben de clientes ni de
 * precios, solo de bloques con hora de inicio y fin.
 */

/** Una franja de trabajo del día, en «HH:mm». */
export interface ScheduleWorkingHours {
  start: string;
  end: string;
}

export interface ScheduleResource {
  id: string;
  name: string;
  avatarUrl?: string | null;
  /** Una línea bajo el nombre: el horario, cuántas citas lleva. */
  subtitle?: string;
  /** Franjas en las que trabaja ese día; vacío o ausente es «no trabaja». */
  workingHours?: readonly ScheduleWorkingHours[];
}

export type ScheduleEventKind = "appointment" | "block";

export type ScheduleTone = "primary" | "positive" | "warning" | "negative" | "info" | "neutral";

export interface ScheduleEventAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface ScheduleEvent {
  id: string;
  resourceId: string;
  start: Date;
  end: Date;
  /** Una cita ocupa la columna con su tarjeta; un bloqueo la tacha. */
  kind?: ScheduleEventKind;
  title: string;
  subtitle?: string;
  /** Una tercera línea: el barbero, una nota. */
  detail?: string;
  tone?: ScheduleTone;
  /** Etiqueta corta junto al título (el tipo de cliente, el estado). */
  badge?: { label: string; tone?: ScheduleTone };
  /** El siguiente paso de la tarjeta: «Ingresar», «Cobrar». */
  action?: ScheduleEventAction;
  /** Algo que revisar; se muestra como icono con tooltip. */
  warning?: string;
  /** Ya pasó o se anuló: se atenúa y se tacha. */
  muted?: boolean;
  /** No se puede arrastrar ni estirar. */
  locked?: boolean;
}

/** Dónde soltó alguien una tarjeta: la columna y la hora nuevas. */
export interface ScheduleDrop {
  resourceId: string;
  start: Date;
  end: Date;
}

/** Un hueco libre que alguien tocó. */
export interface ScheduleSlot {
  resourceId: string;
  start: Date;
  /** Si el recurso trabaja a esa hora. */
  isWorking: boolean;
}

/** Acción del menú de un recurso (la columna de un barbero). */
export interface ScheduleResourceAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}
