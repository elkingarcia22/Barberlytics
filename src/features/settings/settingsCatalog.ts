import { Banknote, CircleUser, Megaphone, Store, Wallet, type LucideIcon } from "lucide-react";
import type { SettingsGroup } from "@/components/app-shell";
import type { AppMessageKey } from "@/app/i18n";
import type { Access } from "@/features/access";

/**
 * Los ajustes de la plataforma, agrupados como en la pantalla que los reúne.
 *
 * No son navegación de producto: no se abren a diario, así que no están en el
 * menú lateral sino en el menú de configuración de la cabecera. Esta lista es
 * la única fuente: de aquí salen ese menú, la pantalla de configuración y el
 * título de cada ajuste al abrirlo.
 *
 * Cada ajuste dice quién lo ve y quién lo cambia (`rule`), según el capítulo de
 * configuración del mapa de roles (docs/roles/05-configuracion.md): lo operativo
 * lo lleva quien administra la cuenta; el dinero y el contrato —facturación,
 * impuestos, moneda, pasarela, comisiones, datos legales, sucursales— solo los
 * edita el dueño; recepción consulta lo que necesita para atender; los barberos
 * ven sus preferencias y su usuario.
 */

/** Lo que se puede hacer con un ajuste: cambiarlo o solo consultarlo. */
export type SettingsLevel = "edit" | "view";
type SettingsRule = (access: Access) => SettingsLevel | null;

const isOwner = (access: Access): boolean => access.role === "owner";
/** Quien administra la cuenta: «Configuraciones de la cuenta» con Activo (dueño y administrador). */
const managesAccount = (access: Access): boolean => access.can("account-settings", "active");
/** Recepción: edita sus cosas de la cuenta, pero sin Activo no administra el negocio. */
const frontDesk = (access: Access): boolean => access.can("account-settings", "edit") && !managesAccount(access);

const RULES = {
  /** De la operación diaria: lo administra quien lleva la cuenta. */
  operative: (access) => (managesAccount(access) ? "edit" : null),
  /** Operativo y además de consulta para recepción, que lo explica al cliente o cobra con ello. */
  operativeShared: (access) => (managesAccount(access) ? "edit" : frontDesk(access) ? "view" : null),
  /** Dinero o contrato de la empresa: lo edita el dueño; el administrador lo consulta. */
  ownerEdits: (access) => (isOwner(access) ? "edit" : managesAccount(access) ? "view" : null),
  /** Solo el dueño, ni siquiera de consulta (el plan contratado). */
  ownerOnly: (access) => (isOwner(access) ? "edit" : null),
  /** «Fechas de cierre»; recepción las consulta para no agendar en un día cerrado. */
  closures: (access) => (access.can("closures", "edit") ? "edit" : access.can("closures") || frontDesk(access) ? "view" : null),
  /** El ciclo de pago: lo fija el dueño; quien ve la nómina lo consulta. */
  payroll: (access) => (isOwner(access) ? "edit" : access.can("payroll") ? "view" : null),
  /** Los permisos de fábrica de cada rol; por ahora de consulta (se cambian por persona en Equipo). */
  permissions: (access) => (access.can("permissions") ? "view" : null),
  /** Lo de cada quien: sus preferencias y su usuario. */
  personal: (access) => (access.can("account-settings") ? "edit" : null),
} satisfies Record<string, SettingsRule>;

interface SettingsItemTemplate {
  id: string;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  /** Quién lo ve y quién lo cambia. */
  rule: SettingsRule;
  /** El rótulo para quien no es dueño, cuando el ajuste cambia de alcance (eliminar «mi usuario», no el negocio). */
  selfLabelKey?: AppMessageKey;
  selfHintKey?: AppMessageKey;
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
      { id: "negocio", labelKey: "settings.business", hintKey: "settings.businessHint", rule: RULES.operativeShared },
      { id: "identidad", labelKey: "settings.identity", hintKey: "settings.identityHint", rule: RULES.operative },
      { id: "sucursales", labelKey: "settings.branches", hintKey: "settings.branchesHint", rule: RULES.ownerEdits },
      { id: "cierres", labelKey: "settings.closures", hintKey: "settings.closuresHint", rule: RULES.closures },
      { id: "agendamiento", labelKey: "settings.booking", hintKey: "settings.bookingHint", rule: RULES.operativeShared },
      { id: "centro-notificaciones", labelKey: "settings.notificationCenter", hintKey: "settings.notificationCenterHint", rule: RULES.operative },
      { id: "empresa", labelKey: "settings.company", hintKey: "settings.companyHint", rule: RULES.ownerEdits },
    ],
  },
  {
    id: "cobros",
    labelKey: "settings.group.charging",
    icon: Banknote,
    items: [
      { id: "precios", labelKey: "settings.prices", hintKey: "settings.pricesHint", rule: RULES.ownerEdits },
      { id: "impuestos", labelKey: "settings.taxes", hintKey: "settings.taxesHint", rule: RULES.ownerEdits },
      { id: "propinas", labelKey: "settings.tips", hintKey: "settings.tipsHint", rule: RULES.operativeShared },
      { id: "tarifa-tarjeta", labelKey: "settings.cardFee", hintKey: "settings.cardFeeHint", rule: RULES.ownerEdits },
      { id: "dispositivos", labelKey: "settings.devices", hintKey: "settings.devicesHint", rule: RULES.operativeShared },
      { id: "pagos", labelKey: "settings.payments", hintKey: "settings.paymentsHint", rule: RULES.ownerEdits },
    ],
  },
  {
    id: "fidelizacion",
    labelKey: "settings.group.loyalty",
    icon: Megaphone,
    items: [
      { id: "cupones", labelKey: "settings.coupons", hintKey: "settings.couponsHint", rule: RULES.operative },
      { id: "marketing", labelKey: "settings.marketing", hintKey: "settings.marketingHint", rule: RULES.operative },
    ],
  },
  {
    id: "pagos-equipo",
    labelKey: "settings.group.teamPay",
    icon: Wallet,
    items: [
      { id: "comisiones", labelKey: "settings.commissions", hintKey: "settings.commissionsHint", rule: RULES.ownerEdits },
      { id: "nomina", labelKey: "settings.payroll", hintKey: "settings.payrollHint", rule: RULES.payroll },
    ],
  },
  {
    id: "cuenta",
    labelKey: "settings.group.account",
    icon: CircleUser,
    items: [
      { id: "preferencias", labelKey: "settings.preferences", hintKey: "settings.preferencesHint", rule: RULES.personal },
      // Cómo entra cada persona y su correo de respaldo por si el SMS no llega.
      { id: "inicio-sesion", labelKey: "settings.signIn", hintKey: "settings.signInHint", rule: RULES.personal },
      // La reserva tal como la ve el cliente, en sus tres pantallas: no es un
      // ajuste sino la vitrina, así que abre su propia página fuera del panel.
      { id: "agendamiento-online", labelKey: "settings.onlineBooking", hintKey: "settings.onlineBookingHint", rule: RULES.operativeShared, path: "/reservar" },
      { id: "permisos", labelKey: "settings.permissions", hintKey: "settings.permissionsHint", rule: RULES.permissions },
      { id: "facturacion", labelKey: "settings.billing", hintKey: "settings.billingHint", rule: RULES.ownerOnly },
      {
        id: "eliminar-cuenta",
        labelKey: "settings.deleteAccount",
        hintKey: "settings.deleteAccountHint",
        rule: RULES.personal,
        selfLabelKey: "settings.deleteUser",
        selfHintKey: "settings.deleteUserHint",
        tone: "danger",
      },
    ],
  },
];

/** Sin `access` se mira como dueño: todo, y cada ajuste editable. */
const ownerView = (access: Access | undefined): boolean => !access || isOwner(access);

/** Qué puede hacer quien mira con un ajuste: cambiarlo, consultarlo o nada (`null`, ni se le enseña). */
export function settingsLevel(id: string | undefined, access?: Access): SettingsLevel | null {
  const item = SETTINGS_TEMPLATE.flatMap((group) => group.items).find((candidate) => candidate.id === id);
  if (!item) return null;
  return access ? item.rule(access) : "edit";
}

/**
 * Los grupos con sus rótulos traducidos y su ruta resuelta. Con `access`, solo
 * los ajustes que ese rol ve (y sin los grupos que se quedan vacíos); sin él,
 * todos, como los ve el dueño.
 */
export function buildSettingsGroups(t: (key: AppMessageKey) => string, access?: Access): readonly SettingsGroup[] {
  const asOwner = ownerView(access);
  return SETTINGS_TEMPLATE.map((group) => ({
    id: group.id,
    label: t(group.labelKey),
    icon: group.icon,
    items: group.items
      .filter((item) => !access || item.rule(access) !== null)
      .map((item) => ({
        id: item.id,
        label: t(!asOwner && item.selfLabelKey ? item.selfLabelKey : item.labelKey),
        description: t(!asOwner && item.selfHintKey ? item.selfHintKey : item.hintKey),
        path: item.path ?? `${SETTINGS_BASE_PATH}/${item.id}`,
        tone: item.tone,
      })),
  })).filter((group) => group.items.length > 0);
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
