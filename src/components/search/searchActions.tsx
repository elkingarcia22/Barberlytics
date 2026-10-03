import * as React from "react";

/** Algo que se puede hacer desde la búsqueda sin ir antes a ningún sitio. */
export interface SearchActionItem {
  id: string;
  label: string;
  /** La línea de debajo: a qué pertenece o qué pasa al elegirla. */
  hint?: string;
  icon?: React.ReactNode;
  /** Por qué no se puede ahora; la deja a la vista, apagada y explicada. */
  blockedReason?: string | null;
  onSelect: () => void;
}

/*
 * Las acciones de la pantalla abierta.
 *
 * La búsqueda vive en la cabecera y las acciones en cada pantalla, muy lejos
 * en el árbol. En vez de subir estado por el shell —que repintaría la cabecera
 * cada vez que una pantalla recalcula sus acciones—, la pantalla deja aquí lo
 * último que declaró y la búsqueda lo lee en el momento de abrirse. Solo hay
 * una pantalla montada a la vez, así que basta con saber quién publicó.
 */
let published: { owner: symbol; items: readonly SearchActionItem[] } | null = null;

/** Lo que ofrece la pantalla abierta en este momento. */
export function readSearchActions(): readonly SearchActionItem[] {
  return published?.items ?? [];
}

const SearchActionsScopeContext = React.createContext(false);

/**
 * Marca el trozo del árbol cuyas acciones son las de la pantalla. Lo pone el
 * shell alrededor de su ancla de acciones: una barra pintada suelta —un
 * ejemplo en la documentación— no llega a la búsqueda.
 */
export function SearchActionsScope({ children }: { children: React.ReactNode }) {
  return <SearchActionsScopeContext.Provider value={true}>{children}</SearchActionsScopeContext.Provider>;
}

/**
 * Publica las acciones de la pantalla para que la búsqueda las ofrezca.
 * Fuera de un `SearchActionsScope` no hace nada, salvo que se fuerce.
 */
export function usePublishSearchActions(items: readonly SearchActionItem[], force = false): void {
  const inScope = React.useContext(SearchActionsScopeContext);
  const isEnabled = inScope || force;
  const [owner] = React.useState(() => Symbol("search-actions"));

  // En cada pintado y no solo al montar: las acciones cierran sobre el estado
  // de la pantalla, y una copia vieja abriría el cajón con datos de antes.
  React.useEffect(() => {
    if (isEnabled) published = { owner, items };
  });

  React.useEffect(
    () => () => {
      if (published?.owner === owner) published = null;
    },
    [owner]
  );
}
