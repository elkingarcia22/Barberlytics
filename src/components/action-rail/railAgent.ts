import * as React from "react";
import type { RailActionSpec } from "./railActions";

/**
 * El agente de IA dentro de la barra flotante.
 *
 * Cuando las acciones viven en la barra, el agente también: el layout de la
 * app declara su acción una vez (`RailAgentProvider`) y cada barra la pone
 * la primera, sin que ninguna pantalla tenga que acordarse. Y al revés: la
 * cabecera necesita saber si hay una barra a la vista para no repetir el
 * botón, así que cada barra se anuncia mientras está montada.
 */
const RailAgentContext = React.createContext<RailActionSpec | null>(null);

export const RailAgentProvider = RailAgentContext.Provider;

export const useRailAgentAction = (): RailActionSpec | null => React.useContext(RailAgentContext);

let mounted = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Lo llama cada barra: cuenta como «a la vista» mientras esté montada. */
export function useAnnounceRail(): void {
  React.useEffect(() => {
    mounted += 1;
    emit();
    return () => {
      mounted -= 1;
      emit();
    };
  }, []);
}

/** Si hay alguna barra flotante en pantalla ahora mismo. */
export function useRailVisible(): boolean {
  return React.useSyncExternalStore(subscribe, () => mounted > 0, () => false);
}
