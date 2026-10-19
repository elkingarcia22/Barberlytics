import * as React from "react";
import { useAppT } from "@/app/i18n";
import { AIButton } from "@/components/ai-interaction";
import { formatClock } from "@/components/scheduling";
import { Heading, Text } from "@/components/typography";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { OrderSummary, type OrderLine } from "@/features/booking/flow/OrderSummary";
import type { Totals } from "@/features/booking/pricing";
import { durationLabel, type ModelContext } from "../calendarModel";
import { ACTION_ICON } from "../appointmentActions";
import { useAskClipper } from "./panelHooks";
import { quickActions, stageTitle, type QuickId } from "./panelLogic";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que va arriba según el momento de la cita, con la cara de la reserva en
 * línea: el titular en la letra de la reserva, el ticket cuando toca cobrar
 * y los atajos en tarjetas, como «Lo que puedes hacer» de la
 * confirmación de la reserva.
 */

const TITLE_TONE = { default: undefined, negative: "text-destructive", positive: "text-success", warning: "text-warning" } as const;

/** El titular del momento y su línea: «Va 12 min tarde · Llámalo o escríbele». */
export function StageHeading({ model, ctx, size = "md" }: { model: AppointmentModel; ctx: ModelContext; size?: "md" | "lg" }) {
  const t = useAppT();
  const title = stageTitle(model, ctx.now, t, ctx.formatMoney, (date) => formatClock(date, ctx.intl));
  return (
    <div className="flex flex-col gap-1" data-stage={model.playbook.stage} data-testid="panel-stage">
      <Heading level={size === "lg" ? 2 : 3} className={cn("first-letter:uppercase", TITLE_TONE[title.tone])} data-testid="appointment-headline">
        {title.title}
      </Heading>
      {title.line && <Text tone="secondary">{title.line}</Text>}
    </div>
  );
}

/** «La cuenta» como el ticket del pago de la reserva: una línea por servicio y producto, y el total. */
export function TicketSummary({ model, ctx }: { model: AppointmentModel; ctx: ModelContext }) {
  const { appointment, services } = model;
  const productLines: OrderLine[] = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
    return product ? [{ id: `p-${product.id}`, label: product.name, detail: `× ${line.qty}`, amount: product.price * line.qty }] : [];
  });
  const lines: OrderLine[] = [...services.map((service) => ({ id: `s-${service.id}`, label: service.name, detail: durationLabel(service.durationMin), amount: service.price })), ...productLines];
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const payment = appointment.payment;
  const totals: Totals = {
    services: services.reduce((sum, service) => sum + service.price, 0),
    products: productLines.reduce((sum, line) => sum + line.amount, 0),
    discount: 0,
    subtotal,
    tax: payment?.tax ?? 0,
    tip: payment?.tip ?? 0,
    fee: 0,
    feeName: null,
    gift: 0,
    reward: 0,
    prepaid: 0,
    total: payment?.total ?? subtotal,
  };
  return (
    <div className="rounded-2xl border border-border bg-surface-subtle p-4" data-testid="panel-ticket">
      <OrderSummary totals={totals} money={ctx.formatMoney} lines={lines} />
    </div>
  );
}

/** «Pregúntale a Clipper» como botón, cuando los atajos del momento no lo traen ya en tarjeta. */
export function ClipperButton({ model, ctx, className }: { model: AppointmentModel; ctx: ModelContext; className?: string }) {
  const t = useAppT();
  const ask = useAskClipper(model, ctx);
  if (quickActions(model).includes("clipper")) return null;
  return <AIButton variant="secondary" size="sm" label={t("calendar.panel.clipper.ask")} onClick={ask} className={className} />;
}

export interface QuickTilesProps {
  model: AppointmentModel;
  ctx: ModelContext;
  /** Cambiar la cita: abre sus campos (en su sitio o en su página, según la versión). */
  onChange: () => void;
}

/** Una tarjeta baja con el icono encima y una palabra debajo, como los atajos de la reserva en línea. */
const TILE =
  "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-0.5 py-3 outline-none transition-colors duration-fast hover:border-primary/50 hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring/50";

/** Con 1 a 4 atajos se reparten el ancho por igual: siempre caben en una fila. */
const COLUMNS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export interface Tile {
  id: string;
  icon: React.ReactNode;
  /** Lo que se ve: una palabra. */
  label: string;
  /** La palabra para el celular, donde cada tarjeta mide unos 53 px («WhatsApp» no cabe). */
  narrowLabel?: string;
  /** Lo que se anuncia y sale al pasar el ratón: la acción completa. */
  title: string;
  href?: string;
  /** Abre en otra pestaña (WhatsApp). */
  external?: boolean;
  onClick?: () => void;
}

/** Los atajos del momento en una sola fila, como los de la reserva en línea: icono y una palabra. */
export function QuickTiles({ model, ctx, onChange }: QuickTilesProps) {
  const t = useAppT();
  const ask = useAskClipper(model, ctx);
  const ids = quickActions(model);
  if (ids.length === 0) return null;
  const glyph = (Icon: React.ComponentType<{ className?: string }>, tone = "text-primary") => <Icon className={cn("size-5", tone)} />;
  const scheduled = model.appointment.status === "scheduled";
  const tiles: Record<QuickId, Tile> = {
    call: { id: "call", icon: glyph(ACTION_ICON.call), label: t("calendar.detail.call"), title: `${t("calendar.detail.call")} ${model.known?.phone ?? ""}`.trim(), href: model.href("call") ?? undefined },
    whatsapp: { id: "whatsapp", icon: glyph(ACTION_ICON.whatsapp), label: t("calendar.detail.whatsapp"), narrowLabel: t("calendar.panel.quick.writeShort"), title: t("calendar.detail.whatsapp"), href: model.href("whatsapp") ?? undefined, external: true },
    noShow: { id: "noShow", icon: glyph(ACTION_ICON.noShow, "text-warning"), label: t("calendar.step.noShow"), title: t("calendar.step.noShow"), onClick: () => model.run("noShow") },
    cancel: { id: "cancel", icon: glyph(ACTION_ICON.cancel, "text-destructive"), label: t("calendar.step.cancel"), title: t("calendar.step.cancel"), onClick: () => model.run("cancel") },
    change: {
      id: "change",
      icon: glyph(ACTION_ICON.edit),
      label: t(scheduled ? "calendar.panel.quick.changeShort" : "calendar.panel.quick.addServiceShort"),
      title: t(scheduled ? "calendar.panel.quick.change" : "calendar.panel.quick.addService"),
      onClick: onChange,
    },
    ready: { id: "ready", icon: glyph(ACTION_ICON.ready, "text-success"), label: t("calendar.panel.quick.readyShort"), title: t("calendar.step.ready"), onClick: () => model.run("ready") },
    clipper: { id: "clipper", icon: <ThemaIcon name="sparkles" tone="primary" />, label: t("calendar.panel.clipper.short"), title: t("calendar.panel.clipper.ask"), onClick: ask },
  };
  return <TileRow tiles={ids.map((id) => tiles[id])} label={t("calendar.panel.quick.title")} />;
}

/** Una fila de atajos: de uno a cuatro, repartidos por igual; icono arriba y una palabra. */
export function TileRow({ tiles, label }: { tiles: readonly Tile[]; label: string }) {
  if (tiles.length === 0) return null;
  return (
    <nav aria-label={label} className={cn("grid gap-1.5 sm:gap-2", COLUMNS[Math.min(tiles.length, 4)])} data-testid="panel-quick">
      {tiles.map((tile) => {
        const body = (
          <>
            {tile.icon}
            {/* Dos líneas como mucho: «No asistió» se parte en el celular en vez de cortarse. */}
            <Text as="span" size="xs" weight="medium" className="line-clamp-2 w-full text-center leading-tight">
              {tile.narrowLabel ? (
                <>
                  <span className="sm:hidden">{tile.narrowLabel}</span>
                  <span className="hidden sm:inline">{tile.label}</span>
                </>
              ) : (
                tile.label
              )}
            </Text>
          </>
        );
        return tile.href ? (
          <a key={tile.id} href={tile.href} target={tile.external ? "_blank" : undefined} rel="noreferrer" className={TILE} aria-label={tile.title} title={tile.title}>
            {body}
          </a>
        ) : (
          <button key={tile.id} type="button" onClick={tile.onClick} className={TILE} aria-label={tile.title} title={tile.title}>
            {body}
          </button>
        );
      })}
    </nav>
  );
}
