import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  Gauge,
  HandCoins,
  Package,
  Receipt,
  Scissors,
  UserCog,
  Users,
} from "lucide-react";
import type { NavEntry } from "@/components/app-shell";
import type { AppMessageKey } from "./i18n/types";

/**
 * Árbol de navegación de la aplicación. Cada nodo lleva su `path`; el shell
 * lo entrega en `onNavigate` y la app decide cómo navegar.
 *
 * Solo está aquí lo que se abre a diario para atender la barbería. Lo que se
 * ajusta una vez —impuestos, propinas, permisos, sucursales— vive en el menú
 * de configuración de la cabecera, no compitiendo con Calendario o Clientes.
 *
 * Los rótulos son **claves**, no texto: el árbol se arma una vez y quien lo
 * monta (AppLayout) los traduce con el idioma activo. Escribirlos aquí en
 * español los dejaría fijos para siempre.
 */
type NavTemplate =
  | { kind: "item"; id: string; labelKey: AppMessageKey; icon: typeof Gauge; path: string }
  | {
      kind: "item";
      id: string;
      labelKey: AppMessageKey;
      icon: typeof Gauge;
      children: readonly { id: string; labelKey: AppMessageKey; path: string }[];
    }
  | { kind: "group"; labelKey: AppMessageKey };

const NAV_TEMPLATE: readonly NavTemplate[] = [
  { kind: "item", id: "inicio", labelKey: "nav.home", icon: Gauge, path: "/dashboard" },
  { kind: "item", id: "calendario", labelKey: "nav.calendar", icon: CalendarDays, path: "/calendario" },
  { kind: "item", id: "clientes", labelKey: "nav.clients", icon: Users, path: "/clientes" },
  // Quién trabaja aquí y con qué rol entra. Estaba como «Permisos» dentro de
  // configuración, pero es una pantalla de todos los días —se da de alta a un
  // barbero, se le cambia el turno—, no algo que se ajuste una vez.
  { kind: "item", id: "equipo", labelKey: "nav.team", icon: UserCog, path: "/usuarios" },
  // Servicios y productos, cada uno por su lado: son dos catálogos distintos
  // —uno se agenda por tiempo, el otro se vende por unidades— y quien atiende
  // entra a uno o al otro, nunca a «los dos». Agruparlos solo añadía un clic.
  { kind: "item", id: "servicios", labelKey: "nav.services", icon: Scissors, path: "/servicios" },
  { kind: "item", id: "productos", labelKey: "nav.products", icon: Package, path: "/productos" },
  { kind: "item", id: "gastos", labelKey: "nav.expenses", icon: Receipt, path: "/gastos" },
  { kind: "item", id: "nomina", labelKey: "nav.payroll", icon: HandCoins, path: "/nomina" },
  { kind: "item", id: "transacciones", labelKey: "nav.transactions", icon: ArrowLeftRight, path: "/transacciones" },
  { kind: "group", labelKey: "nav.resources" },
  // El centro de ayuda no va aquí: se llega desde el menú «Ayuda» de la
  // cabecera (preguntar, ir al centro de ayuda, que te guíen).
  { kind: "item", id: "docs", labelKey: "nav.designSystem", icon: BookOpen, path: "/docs" },
];

/** El árbol con los rótulos ya traducidos. */
export function buildAppNavigation(t: (key: AppMessageKey) => string): readonly NavEntry[] {
  return NAV_TEMPLATE.map((entry) => {
    if (entry.kind === "group") return { kind: "group", label: t(entry.labelKey) };
    if ("children" in entry) {
      return {
        kind: "item",
        id: entry.id,
        label: t(entry.labelKey),
        icon: entry.icon,
        children: entry.children.map((child) => ({ id: child.id, label: t(child.labelKey), path: child.path })),
      };
    }
    return { kind: "item", id: entry.id, label: t(entry.labelKey), icon: entry.icon, path: entry.path };
  });
}

/** El árbol sin traducir, para `findActiveNavId` y para las pruebas. */
export const APP_NAVIGATION: readonly NavEntry[] = buildAppNavigation((key) => key);

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
