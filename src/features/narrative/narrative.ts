import { useQuery } from "@tanstack/react-query";

/**
 * Hechos → narración en la app: las cifras ya calculadas van a `/api/narrative`, que las redacta con
 * Claude sin poder cambiarlas (ver server/narrative). Sin clave, con error o si la redacción no
 * respeta las cifras, se muestra el resumen automático: el mismo contenido, escrito con plantilla.
 */

export interface Fact {
  label: string;
  value: string;
}
export type Facts = Record<string, Fact>;

export interface Narrative {
  text: string;
  source: "ai" | "auto";
  model: string | null;
}

async function requestNarrative(kind: "week" | "pay", locale: "es" | "en", facts: Facts, fallback: string, signal: AbortSignal): Promise<Narrative> {
  try {
    const response = await fetch("/api/narrative", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, locale, facts }), signal });
    if (!response.ok) return { text: fallback, source: "auto", model: null };
    const body = (await response.json()) as { text?: string; model?: string };
    return body.text ? { text: body.text, source: "ai", model: body.model ?? null } : { text: fallback, source: "auto", model: null };
  } catch (error) {
    if (signal.aborted) throw error;
    return { text: fallback, source: "auto", model: null };
  }
}

export function useNarrative(kind: "week" | "pay", locale: "es" | "en", facts: Facts | null, fallback: string) {
  return useQuery({
    queryKey: ["narrative", kind, locale, facts],
    queryFn: ({ signal }) => requestNarrative(kind, locale, facts ?? {}, fallback, signal),
    enabled: facts !== null,
    staleTime: Infinity,
    retry: false,
  });
}
