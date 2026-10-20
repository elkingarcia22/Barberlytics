import * as React from "react";
import { Ban, CreditCard, ReceiptText, Repeat, Send, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useAccess } from "@/features/access";
import { describeError } from "@/lib/api";
import { appointmentEnd, appointmentStart, type ModelContext } from "../calendarModel";
import type { AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { ACTION_ICON } from "../appointmentActions";
import { useRestrictClient } from "../queries";
import { ConfirmContent, VoidSaleContent } from "./StatusConfirm";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ClientField } from "./ClientField";
import { PinSeries } from "./PinSeries";
import { ClientTags, MoreActionsMenu } from "./PanelParts";
import { LinkedField, PanelStepper } from "./PanelShared";
import { writeMenu } from "./writeChannels";
import { SourceLine } from "./SourceLine";
import { StageHeading, TileRow, type Tile } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * La cita ya cerrada —cobrada, o que no se atendió—. Lo que importa ya no es
 * la cita sino lo que sigue con el cliente: reagendarla (el botón principal),
 * fijarla, mandarle el recibo, verlo (ahí está lo que se cobró) o devolver
 * dinero si hace falta, y con qué citas iba enlazada. Lo demás (cambiar
 * servicio o barbero, la nota para el barbero, las alertas) ya no tiene uso
 * y se queda fuera; sigue en la ficha del cliente y en el historial.
 *
 * Se cuenta con la tarjeta grande teñida del estado (verde cobrada; roja
 * cancelada o si no asistió), con el cliente, lo que se hizo y sus atajos dentro.
 */

export interface AfterVisitProps extends Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> {
  model: AppointmentModel;
  ctx: ModelContext;
  onOpenClient: () => void;
  /** Devolver: una página dentro del panel. */
  onOpenRefund: () => void;
  /** Reagendar: una página dentro del panel (lo agenda la barbería o se le manda el enlace). */
  onOpenRebook: () => void;
  /** Enviar el recibo por correo o SMS: una página dentro del panel. */
  onOpenSendReceipt: () => void;
  /** Ver el recibo: una página dentro del panel (no se sale del calendario). */
  onOpenReceipt: () => void;
}

/** El tinte de la tarjeta según cómo se cerró: verde cobrada; rojo cancelada o si no asistió. */
const MOMENT_TINT = { paid: "from-success/15 via-success/5", cancelled: "from-destructive/15 via-destructive/5", noShow: "from-destructive/15 via-destructive/5" } as const;

/**
 * Los atajos de después: recibo y devolución si se cobró; si no vino o se
 * canceló, llamar y escribir y —para quien puede (dueño, administrador,
 * recepción, renta)— pedirle pago por adelantado o bloquearlo.
 */
function useAfterTiles(model: AppointmentModel, ctx: ModelContext, onPin: () => void, onRefund: () => void, onSendReceipt: () => void, onReceipt: () => void): Tile[] {
  const t = useAppT();
  const restrict = useRestrictClient();
  const access = useAccess();
  const { appointment } = model;
  const payment = appointment.status === "paid" ? appointment.payment : null;
  const tiles: Tile[] = [];
  if (payment) {
    // Fijar la cita (como en la reserva en línea): las próximas con el mismo barbero y a la misma hora.
    tiles.push({ id: "pin", icon: <Repeat className="size-5 text-primary" />, label: t("calendar.panel.pin.short"), title: t("calendar.panel.pin.title"), onClick: onPin });
    if (model.phone || model.email) {
      tiles.push({ id: "send", icon: <Send className="size-5 text-primary" />, label: t("calendar.panel.after.send"), title: t("calendar.panel.after.sendTitle"), onClick: onSendReceipt });
    }
    tiles.push({ id: "receipt", icon: <ReceiptText className="size-5 text-primary" />, label: t("calendar.panel.after.receipt"), title: t("calendar.panel.after.receiptTitle"), onClick: onReceipt });
    if (access.can("transactions", "edit")) {
      tiles.push({ id: "refund", icon: <Undo2 className="size-5 text-warning" />, label: t("calendar.panel.after.refund"), title: t("calendar.panel.after.refundTitle"), onClick: onRefund });
    }
  } else {
    if (model.phone) {
      const Call = ACTION_ICON.call;
      const Chat = ACTION_ICON.message;
      tiles.push({ id: "call", icon: <Call className="size-5 text-primary" />, label: t("calendar.detail.call"), title: t("calendar.detail.call"), href: model.href("call") ?? undefined });
      tiles.push({ id: "message", icon: <Chat className="size-5 text-primary" />, label: t("calendar.detail.message"), title: t("calendar.panel.write.title"), menu: writeMenu(model, t) });
    }
    const known = model.known;
    if (known && (ctx.access?.canRestrictClients ?? true)) {
      const name = model.firstName;
      const save = (patch: { blocked: boolean } | { onlineOnly: boolean }, done: string) =>
        restrict.mutate(
          { clientId: known.id, patch },
          {
            onSuccess: () => toast.success(done),
            onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
          }
        );
      // Pago por adelantado: el ajuste «Reserva y pago solo en línea» de su ficha. Se pone o se quita con un toque.
      tiles.push(
        known.onlineOnly
          ? { id: "prepay", icon: <CreditCard className="size-5 text-text-secondary" />, label: t("calendar.panel.restrict.prepayOff"), title: t("calendar.panel.restrict.prepayOffTitle", { name }), onClick: () => save({ onlineOnly: false }, t("calendar.panel.restrict.prepayOffDone", { name })) }
          : { id: "prepay", icon: <CreditCard className="size-5 text-warning" />, label: t("calendar.panel.restrict.prepay"), title: t("calendar.panel.restrict.prepayTitle", { name }), onClick: () => save({ onlineOnly: true }, t("calendar.panel.restrict.prepayDone", { name })) }
      );
      // Bloquear pide confirmar: ya no reserva en línea ni se le agenda.
      tiles.push(
        known.blocked
          ? { id: "block", icon: <ShieldOff className="size-5 text-text-secondary" />, label: t("calendar.panel.restrict.unblock"), title: t("calendar.panel.restrict.unblockTitle", { name }), onClick: () => save({ blocked: false }, t("calendar.panel.restrict.unblockDone", { name })) }
          : {
              id: "block",
              icon: <Ban className="size-5 text-destructive" />,
              label: t("calendar.panel.restrict.block"),
              title: t("calendar.panel.restrict.blockTitle", { name }),
              confirm: (close) => <ConfirmContent title={t("customers.block.title", { name: model.clientName })} hint={t("customers.block.hint")} confirmLabel={t("calendar.panel.restrict.block")} onConfirm={() => save({ blocked: true }, t("customers.block.done"))} onClose={close} testId="panel-block" />,
            }
      );
    }
  }
  return tiles;
}


/** La tarjeta grande con quién vino, lo que se hizo y sus atajos dentro; lo demás, debajo. */
export function AfterVisit({ model, ctx, onOpenClient, onOpenRefund, onOpenRebook, onOpenSendReceipt, onOpenReceipt, linked = [], onSelectAppointment, onUnlink, onShowLinked }: AfterVisitProps) {
  const t = useAppT();
  // Fijar la cita se abre debajo de la tarjeta; reagendar y enviar el recibo son páginas del panel.
  const [pinning, setPinning] = React.useState(false);
  const tiles = useAfterTiles(model, ctx, () => setPinning((current) => !current), onOpenRefund, onOpenSendReceipt, onOpenReceipt);
  const [voiding, setVoiding] = React.useState(false);
  // Borrar una venta hecha por error: del dueño y del administrador.
  const canVoid = ctx.access?.canVoidSales ?? true;
  const { appointment, services, barber } = model;
  const paid = appointment.status === "paid" && appointment.payment !== null;
  const products = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
    return product ? [`${product.name} × ${line.qty}`] : [];
  });
  return (
    <div className="flex flex-col gap-5" data-testid="panel-after">
      {paid && <PanelStepper model={model} ctx={ctx} />}
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", paid ? MOMENT_TINT.paid : appointment.status === "no_show" ? MOMENT_TINT.noShow : MOMENT_TINT.cancelled)} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" />
        <div className="-mt-2 flex flex-col gap-2">
          <SourceLine appointment={appointment} />
          <ClientTags model={model} />
        </div>
        <ClientField model={model} ctx={ctx} onOpenPage={onOpenClient} />
        <div className="flex items-center gap-3">
          <IconTile size="lg" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
          <div className="flex min-w-0 flex-col">
            <Text weight="semibold" truncate>
              {[services.map((service) => service.name).join(" + "), ...products].filter(Boolean).join(" · ") || "—"}
            </Text>
            <Text size="sm" tone="secondary" tabular truncate>
              {`${formatClock(appointmentStart(appointment), ctx.intl)} – ${formatClock(appointmentEnd(appointment), ctx.intl)} · ${barber?.name ?? "—"}`}
            </Text>
          </div>
        </div>
        <LinkedField model={model} ctx={ctx} linked={linked} onSelectAppointment={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />
        <TileRow tiles={tiles} label={t("calendar.panel.after.title")} />
        {/* La acción principal de la cita cerrada: agendarle la próxima. Lo cobrado está en «Ver recibo». */}
        <div className="flex items-center gap-2">
          <Button size="lg" className="flex-1" onClick={onOpenRebook} data-testid="panel-rebook">
            <ThemaIcon name="calendarAdd" />
            {t("calendar.panel.after.rebook")}
          </Button>
          {/* Cancelada o no asistió por error: se reactiva (vuelve a pendiente). Cobrada por error: se borra la venta. */}
          {!paid && <MoreActionsMenu model={model} actions={[]} extra={[{ id: "undo", label: t("calendar.panel.reactivate"), icon: Undo2, onSelect: () => model.setStatus("scheduled") }]} />}
          {paid && canVoid && (
            <Popover open={voiding} onOpenChange={setVoiding}>
              <PopoverAnchor asChild>
                <span>
                  <MoreActionsMenu model={model} actions={[]} extra={[{ id: "void", label: t("calendar.void.action"), icon: Trash2, onSelect: () => requestAnimationFrame(() => setVoiding(true)) }]} />
                </span>
              </PopoverAnchor>
              <PopoverContent align="end" className="w-80" onFocusOutside={(event) => event.preventDefault()}>
                <VoidSaleContent model={model} onClose={() => setVoiding(false)} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </section>
      {pinning && <PinSeries model={model} ctx={ctx} onClose={() => setPinning(false)} />}
    </div>
  );
}
