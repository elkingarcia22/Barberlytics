import * as React from "react";

/**
 * Enrutado por hash, sin dependencias: `#/`, `#/foundations/<id>`,
 * `#/guides/<id>` y `#/components/<id>`. El hash es estado compartible (copiar la URL lleva a la
 * misma página) y no necesita configuración del servidor.
 */
export type DocsRoute =
  | { kind: "home" }
  | { kind: "foundation"; id: string }
  | { kind: "guide"; id: string }
  | { kind: "component"; id: string }
  | { kind: "group"; id: string };

export function parseHash(hash: string): DocsRoute {
  const path = hash.replace(/^#/, "").replace(/^\/+/, "");
  const [section, id] = path.split("/").filter(Boolean);
  if (section === "foundations" && id) return { kind: "foundation", id };
  if (section === "guides" && id) return { kind: "guide", id };
  if (section === "components" && id) return { kind: "component", id };
  if (section === "group" && id) return { kind: "group", id };
  return { kind: "home" };
}

export function routeToHash(route: DocsRoute): string {
  switch (route.kind) {
    case "home":
      return "#/";
    case "foundation":
      return `#/foundations/${route.id}`;
    case "guide":
      return `#/guides/${route.id}`;
    case "component":
      return `#/components/${route.id}`;
    case "group":
      return `#/group/${route.id}`;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useHashRoute(): { route: DocsRoute; hash: string; navigate: (route: DocsRoute) => void } {
  const hash = React.useSyncExternalStore(subscribe, () => window.location.hash, () => "#/");
  const route = React.useMemo(() => parseHash(hash), [hash]);
  const navigate = React.useCallback((next: DocsRoute) => {
    window.location.hash = routeToHash(next);
  }, []);
  return { route, hash, navigate };
}
