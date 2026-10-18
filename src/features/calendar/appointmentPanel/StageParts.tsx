import * as React from "react";
import { useAppT } from "@/app/i18n";
import { AIButton } from "@/components/ai-interaction";
import { formatClock } from "@/components/scheduling";
import { Heading, Text } from "@/components/typography";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { OrderSummary, type OrderLine } from "@/features/booking/flow/OrderSummary";
import type { Totals } from "@/features/booking/pricing";
import { durationLabel, type ModelContext } from "../calendarModel";
import { ACTION_ICON } from "../appointmentActions";
import { useAskClipper } from "./panelHooks";
import { ReferencePhotos } from "./PanelParts";
import { quickActions, stageTitle, type QuickId } from "./panelLogic";
import { SourceLine } from "./SourceLine";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Lo que va arriba según el momento de la cita, con la cara de la reserva en
 * línea: el titular en la letra de la reserva, lo que el cliente pidió al
 * reservar (nota y fotos) mientras aún no se cobra, el ticket cuando toca
 * cobrar y los atajos en tarjetas, como «Lo que puedes hacer» de la
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

/** Lo que el cliente pidió al reservar: su nota y las fotos del corte, a la vista antes de empezar. */
export function BookingRequest({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  const { appointment } = model;
  if (!appointment.notes && !appointment.referencePhotos?.length) return null;
  return (
    <section aria-label={t("calendar.panel.request.title")} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4" data-testid="panel-request">
      <div className="flex items-center gap-3">
        <IconTile size="md" shape="circle" tone="primary" icon={<ThemaIcon name={appointment.source === "online" ? "globe" : "edit"} />} />
        <span className="flex min-w-0 flex-col">
          <Text weight="semibold">{t("calendar.panel.request.title")}</Text>
          <SourceLine appointment={appointment} />
        </span>
      </div>
      {appointment.notes && <Text className="border-l-2 border-primary/60 pl-3 italic">«{appointment.notes}»</Text>}
      <ReferencePhotos model={model} />
    </section>
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

/** Los atajos del momento en tarjetas apiladas, de a dos, como en la confirmación de la reserva. */
export function QuickTiles({ model, ctx, onChange }: QuickTilesProps) {
  const t = useAppT();
  const ask = useAskClipper(model, ctx);
  const ids = quickActions(model);
  if (ids.length === 0) return null;
  const tile = (id: QuickId) => {
    const icon = (glyph: React.ReactNode, tone: React.ComponentProps<typeof IconTile>["tone"] = "neutral") => <IconTile size="md" shape="circle" tone={tone} icon={glyph} />;
    const Call = ACTION_ICON.call;
    const Chat = ACTION_ICON.whatsapp;
    const NoShow = ACTION_ICON.noShow;
    const Cancel = ACTION_ICON.cancel;
    const Ready = ACTION_ICON.ready;
    switch (id) {
      case "call":
        return <ActionTile key={id} layout="stacked" leading={icon(<Call />)} title={t("calendar.detail.call")} description={model.known?.phone} href={model.href("call") ?? undefined} />;
      case "whatsapp":
        return <ActionTile key={id} layout="stacked" leading={icon(<Chat />)} title={t("calendar.detail.whatsapp")} description={t("calendar.panel.quick.whatsappHint")} href={model.href("whatsapp") ?? undefined} />;
      case "noShow":
        return <ActionTile key={id} layout="stacked" leading={icon(<NoShow />, "warning")} title={t("calendar.step.noShow")} description={t("calendar.panel.quick.noShowHint")} onClick={() => model.run("noShow")} />;
      case "cancel":
        return <ActionTile key={id} layout="stacked" leading={icon(<Cancel />, "negative")} title={t("calendar.step.cancel")} description={t("calendar.panel.quick.cancelHint")} onClick={() => model.run("cancel")} />;
      case "change":
        return <ActionTile key={id} layout="stacked" leading={icon(<ThemaIcon name="edit" />)} title={t(model.appointment.status === "scheduled" ? "calendar.panel.quick.change" : "calendar.panel.quick.addService")} description={t(model.appointment.status === "scheduled" ? "calendar.panel.quick.changeHint" : "calendar.panel.quick.addServiceHint")} onClick={onChange} />;
      case "ready":
        return <ActionTile key={id} layout="stacked" leading={icon(<Ready />, "positive")} title={t("calendar.step.ready")} description={t("calendar.panel.quick.readyHint", { barber: model.barber?.name.split(" ")[0] ?? "" })} onClick={() => model.run("ready")} />;
      case "clipper":
        return <ActionTile key={id} layout="stacked" leading={icon(<ThemaIcon name="sparkles" />, "ai")} title={t("calendar.panel.clipper.ask")} description={t("calendar.panel.clipper.hint")} onClick={ask} />;
    }
  };
  return (
    <nav aria-label={t("calendar.panel.quick.title")} className="grid grid-cols-2 gap-2" data-testid="panel-quick">
      {ids.map(tile)}
    </nav>
  );
}
