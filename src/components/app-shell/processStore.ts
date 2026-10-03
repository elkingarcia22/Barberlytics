import * as React from "react";
import type { IconName } from "@/icons";

/**
 * Algo que sigue trabajando aunque la persona cambie de pantalla: una
 * importación, una subida de archivos, una exportación. Lo publica quien lo
 * lanza y el Centro de procesos de la cabecera lo enseña con su avance.
 */
export interface ShellProcess {
  id: string;
  title: string;
  /** La línea de debajo: qué lleva hecho, cuánto falta o cómo acabó. */
  meta: string;
  /** De 0 a 100 mientras corre. Sin número, está en espera de su turno. */
  progress?: number;
  /** Ya terminó: se queda en la lista como hecho hasta que se recargue. */
  done?: boolean;
  /** Se detuvo sin acabar. `meta` dice por qué. */
  failed?: boolean;
  icon?: IconName;
  /** Lo que se puede hacer con él: «Ver», «Reintentar», «Descargar». */
  actionLabel?: string;
  onAction?: () => void;
}

export type ShellProcessState = "running" | "waiting" | "done" | "failed";

export function processState(process: ShellProcess): ShellProcessState {
  if (process.failed) return "failed";
  if (process.done) return "done";
  return process.progress === undefined ? "waiting" : "running";
}

/*
 * Un almacén fuera de React y no un contexto: quien publica es una pantalla y
 * quien lee es la cabecera, y el proceso tiene que sobrevivir a que la pantalla
 * se desmonte —esa es la gracia—. Un contexto moriría con ella.
 */
let processes: readonly ShellProcess[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Lo que se ve en la fila. Si no cambió no se avisa: se puede publicar en cada pintado sin repintar la cabecera. */
const looksSame = (a: ShellProcess, b: ShellProcess) =>
  a.title === b.title && a.meta === b.meta && a.progress === b.progress && a.done === b.done && a.failed === b.failed && a.icon === b.icon && a.actionLabel === b.actionLabel;

/** Añade el proceso o, si ya estaba, lo reemplaza en su sitio. Los nuevos van arriba. */
export function publishProcess(process: ShellProcess): void {
  const current = processes.find((item) => item.id === process.id);
  if (current && looksSame(current, process) && current.onAction === process.onAction) return;
  const isVisibleChange = !current || !looksSame(current, process);
  processes = current ? processes.map((item) => (item.id === process.id ? process : item)) : [process, ...processes];
  // Un `onAction` nuevo con la misma cara no es un cambio que haya que pintar,
  // pero sí tiene que quedar guardado: cierra sobre el estado de quien publica.
  if (isVisibleChange) emit();
}

/** Cambia parte de un proceso ya publicado; si no existe, no hace nada. */
export function updateProcess(id: string, change: Partial<Omit<ShellProcess, "id">>): void {
  const current = processes.find((item) => item.id === id);
  if (current) publishProcess({ ...current, ...change });
}

export function removeProcess(id: string): void {
  if (!processes.some((item) => item.id === id)) return;
  processes = processes.filter((item) => item.id !== id);
  emit();
}

/** Vacía la lista. Para pruebas y para cerrar sesión: los procesos son de quien los lanzó. */
export function clearProcesses(): void {
  if (processes.length === 0) return;
  processes = [];
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => processes;

/** Los procesos publicados, del más reciente al más antiguo. */
export function useShellProcesses(): readonly ShellProcess[] {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot);
}
