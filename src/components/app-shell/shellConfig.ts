import * as React from "react";
import {
  AGENT_SUGGESTIONS,
  CHAT_HISTORY,
  COMPANIES,
  COMPANY_MENU_LINKS,
  CURRENT_USER,
  NAV_TREE,
  NEWS_ITEMS,
  NOTIFICATIONS,
  type ChatHistoryGroup,
  type Company,
  type NavEntry,
  type NewsItem,
  type NotificationItem,
} from "./appShellData";

/**
 * Todo lo que el shell muestra y que en una aplicación real viene del
 * backend o del router: la persona conectada, el árbol de navegación, las
 * notificaciones, las empresas y los callbacks. Los valores por defecto son
 * los datos de demostración de `appShellData.ts`, así los ejemplos de la
 * documentación siguen funcionando sin configurar nada.
 */
export interface ShellUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface ShellBrand {
  productName: string;
  tagline?: string;
}

export interface ShellPromo {
  title: string;
  description: string;
  cta: string;
  onClick?: () => void;
}

export interface ShellConfig {
  user: ShellUser;
  brand: ShellBrand;
  navigation: readonly NavEntry[];
  /** Id del nodo activo (raíz, hijo u hoja). Sin él, el sidebar gestiona su propio estado. */
  activeNavId?: string;
  /** Se llama con el id del nodo y su `path` cuando la persona elige un ítem de navegación. */
  onNavigate?: (id: string, path?: string) => void;
  notifications: readonly NotificationItem[];
  news: readonly NewsItem[];
  companies: readonly Company[];
  companyMenuLinks: readonly string[];
  chatHistory: readonly ChatHistoryGroup[];
  agentSuggestions: readonly string[];
  /** Tarjeta promocional del sidebar; `null` la oculta. */
  promo: ShellPromo | null;
  /** Ítem "Cerrar sesión" del menú de perfil; sin él, el ítem no se muestra. */
  onLogout?: () => void;
  /** Envío de un prompt en el panel del agente. */
  onAgentPrompt?: (prompt: string) => void;
  /**
   * Modo oscuro controlado desde fuera (p. ej. el ThemeProvider). Si se
   * pasa, el shell delega el cambio en vez de tocar la clase `dark` por su
   * cuenta.
   */
  isDark?: boolean;
  onToggleDark?: (isDark: boolean) => void;
  /** Controles extra a la izquierda de las notificaciones (p. ej. el selector de tema). */
  headerActions?: React.ReactNode;
}

export type ShellConfigOverrides = Partial<ShellConfig>;

export const DEFAULT_SHELL_CONFIG: ShellConfig = {
  user: CURRENT_USER,
  brand: { productName: "Thema", tagline: "Sistema de diseño" },
  navigation: NAV_TREE,
  notifications: NOTIFICATIONS,
  news: NEWS_ITEMS,
  companies: COMPANIES,
  companyMenuLinks: COMPANY_MENU_LINKS,
  chatHistory: CHAT_HISTORY,
  agentSuggestions: AGENT_SUGGESTIONS,
  promo: {
    title: "El LMS que trabaja por ti",
    description: "Conoce nuestro nuevo sistema inteligente para crear contenido.",
    cta: "Conocer más",
  },
};

export const ShellConfigContext = React.createContext<ShellConfig>(DEFAULT_SHELL_CONFIG);

export function useShellConfig(): ShellConfig {
  return React.useContext(ShellConfigContext);
}

export function resolveShellConfig(overrides?: ShellConfigOverrides): ShellConfig {
  return overrides ? { ...DEFAULT_SHELL_CONFIG, ...overrides } : DEFAULT_SHELL_CONFIG;
}

/** Iniciales para el avatar cuando no hay imagen: "Carolina Vargas" → "CV". */
export function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
