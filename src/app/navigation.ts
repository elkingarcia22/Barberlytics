import { BookOpen, Home, Users } from "lucide-react";
import type { NavEntry } from "@/components/app-shell";

/**
 * Árbol de navegación de la aplicación. Cada nodo lleva su `path`; el shell
 * lo entrega en `onNavigate` y la app decide cómo navegar.
 */
export const APP_NAVIGATION: readonly NavEntry[] = [
  { kind: "item", id: "dashboard", label: "Inicio", icon: Home, path: "/dashboard" },
  { kind: "group", label: "Gestión" },
  { kind: "item", id: "usuarios", label: "Personas", icon: Users, path: "/usuarios" },
  { kind: "group", label: "Recursos" },
  { kind: "item", id: "docs", label: "Sistema de diseño", icon: BookOpen, path: "/docs" },
];

/** El nodo cuyo `path` mejor coincide con la ruta actual (el prefijo más largo). */
export function findActiveNavId(pathname: string): string | undefined {
  let best: { id: string; length: number } | undefined;
  const visit = (id: string, path?: string) => {
    if (path && (pathname === path || pathname.startsWith(`${path}/`)) && (!best || path.length > best.length)) {
      best = { id, length: path.length };
    }
  };
  for (const entry of APP_NAVIGATION) {
    if (entry.kind !== "item") continue;
    visit(entry.id, entry.path);
    for (const child of entry.children ?? []) {
      visit(child.id, child.path);
      for (const leaf of child.children ?? []) visit(leaf.id, leaf.path);
    }
  }
  return best?.id;
}
