import type { BookingSettings } from "../settingsTypes";

/** Las ayudas sin JSX de Reservas online: el enlace con seguimiento, la política con sus valores y el fragmento del widget. */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
}

/** El enlace de reserva con los parámetros UTM que se hayan escrito; vacíos no se añaden. */
export function buildBookingUrl(base: string, utm: UtmParams): string {
  const params = new URLSearchParams();
  if (utm.source.trim()) params.set("utm_source", utm.source.trim());
  if (utm.medium.trim()) params.set("utm_medium", utm.medium.trim());
  if (utm.campaign.trim()) params.set("utm_campaign", utm.campaign.trim());
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export interface PolicyValues {
  cancel: string;
  fee: string;
  max: string;
}

/** La política tal como la lee el cliente: las etiquetas `<<…>>` se cambian por lo configurado. */
export function renderPolicy(policy: string, values: PolicyValues): string {
  return policy.replaceAll("<<time_for_cancel>>", values.cancel).replaceAll("<<fee_cancellation>>", values.fee).replaceAll("<<max_cancellations>>", values.max);
}

export interface WidgetOptions {
  widget: "booking" | "appointments";
  mode: "floating" | "inline";
  /** Selector del enlace propio que abre el panel; sin él aparece el botón flotante. */
  trigger?: string;
  /** A dónde vuelve el cliente al salir del portal. */
  homeUrl?: string;
}

/** El fragmento que se pega en el sitio de la barbería. */
export function widgetSnippet(links: BookingSettings["links"], { widget, mode, trigger, homeUrl }: WidgetOptions): string {
  const attributes = [`data-bl-widget="${widget}"`, `data-uuid="${links.widgetId}"`, `data-mode="${mode}"`, trigger ? `data-trigger="${trigger}"` : null, homeUrl ? `data-home-url="${homeUrl}"` : null].filter(Boolean);
  return `<div ${attributes.join("\n     ")}></div>\n\n<script src="${links.scriptUrl}" async></script>`;
}
