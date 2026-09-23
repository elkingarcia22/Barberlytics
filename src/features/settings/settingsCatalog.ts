import { Banknote, CircleUser, Store, Wallet, type LucideIcon } from "lucide-react";
import type { SettingsGroup } from "@/components/app-shell";
import type { AppMessageKey } from "@/app/i18n";

/**
 * Los ajustes de la plataforma, agrupados como en la pantalla que los reúne.
 *
 * No son navegación de producto: no se abren a diario, así que no están en el
 * menú lateral sino en el menú de configuración de la cabecera. Esta lista es
 * la única fuente: de aquí salen ese menú, la pantalla de configuración y el
 * título de cada ajuste al abrirlo.
 */
interface SettingsItemTemplate {
  id: string;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  /** Ruta propia; sin ella, el ajuste vive dentro de `/configuracion`. */
  path?: string;
  tone?: "default" | "danger";
}

interface SettingsGroupTemplate {
  id: string;
  labelKey: AppMessageKey;
  icon: LucideIcon;
  items: readonly SettingsItemTemplate[];
}

export const SETTINGS_BASE_PATH = "/configuracion";

/**
 * Cuatro grupos, no cinco, y cada uno responde a una pregunta distinta: qué
 * es el negocio, cómo cobra, cómo paga a los suyos y qué tiene contratado con
 * la plataforma. Antes «Configuración de la cuenta» mezclaba la identidad del
 * local con los datáfonos y con la factura del plan, y «Equipo» competía de
 * nombre con el módulo de equipo del menú sin ser lo mismo.
 *
 * Los permisos ya no están aquí: eran la pantalla de equipo (`/usuarios`)
 * escondida detrás de un ajuste, y esa pantalla se abre a diario, así que
 * subió al menú lateral como «Equipo».
 */
const SETTINGS_TEMPLATE: readonly SettingsGroupTemplate[] = [
  {
    id: "negocio",
    labelKey: "settings.group.business",
    icon: Store,
    items: [
      { id: "negocio", labelKey: "settings.business", hintKey: "settings.businessHint" },
      { id: "sucursales", labelKey: "settings.branches", hintKey: "settings.branchesHint" },
      { id: "cierres", labelKey: "settings.closures", hintKey: "settings.closuresHint" },
      { id: "agendamiento", labelKey: "settings.booking", hintKey: "settings.bookingHint" },
      { id: "centro-notificaciones", labelKey: "settings.notificationCenter", hintKey: "settings.notificationCenterHint" },
      { id: "empresa", labelKey: "settings.company", hintKey: "settings.companyHint" },
    ],
  },
  {
    id: "cobros",
    labelKey: "settings.group.charging",
    icon: Banknote,
    items: [
      { id: "precios", labelKey: "settings.prices", hintKey: "settings.pricesHint" },
      { id: "impuestos", labelKey: "settings.taxes", hintKey: "settings.taxesHint" },
      { id: "propinas", labelKey: "settings.tips", hintKey: "settings.tipsHint" },
      { id: "tarifa-tarjeta", labelKey: "settings.cardFee", hintKey: "settings.cardFeeHint" },
      { id: "dispositivos", labelKey: "settings.devices", hintKey: "settings.devicesHint" },
      { id: "pagos", labelKey: "settings.payments", hintKey: "settings.paymentsHint" },
    ],
  },
  {
    id: "pagos-equipo",
    labelKey: "settings.group.teamPay",
    icon: Wallet,
    items: [
      { id: "comisiones", labelKey: "settings.commissions", hintKey: "settings.commissionsHint" },
      { id: "nomina", labelKey: "settings.payroll", hintKey: "settings.payrollHint" },
    ],
  },
  {
    id: "cuenta",
    labelKey: "settings.group.account",
    icon: CircleUser,
    items: [
      { id: "facturacion", labelKey: "settings.billing", hintKey: "settings.billingHint" },
      { id: "eliminar-cuenta", labelKey: "settings.deleteAccount", hintKey: "settings.deleteAccountHint", tone: "danger" },
    ],
  },
];

/** Los grupos con sus rótulos traducidos y su ruta resuelta. */
export function buildSettingsGroups(t: (key: AppMessageKey) => string): readonly SettingsGroup[] {
  return SETTINGS_TEMPLATE.map((group) => ({
    id: group.id,
    label: t(group.labelKey),
    icon: group.icon,
    items: group.items.map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      description: t(item.hintKey),
      path: item.path ?? `${SETTINGS_BASE_PATH}/${item.id}`,
      tone: item.tone,
    })),
  }));
}

/** El pie del menú de configuración: la pantalla que los reúne todos. */
export const SETTINGS_ALL = { id: "configuracion", path: SETTINGS_BASE_PATH } as const;

/** Un ajuste por su id, para titular su pantalla. */
export function findSettingsItem(groups: readonly SettingsGroup[], id: string | undefined) {
  if (!id) return undefined;
  for (const group of groups) {
    const item = group.items.find((candidate) => candidate.id === id);
    if (item) return { group, item };
  }
  return undefined;
}
