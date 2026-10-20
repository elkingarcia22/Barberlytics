import { CalendarSearch, Unlink } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { SearchableSelect } from "@/components/forms";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { ClientAvatar, DetailRow, ServiceThumb } from "../calendarShared";
import { appointmentRange, appointmentTotal, findBarber, findClient, servicesOf, type ModelContext } from "../calendarModel";
import type { Appointment } from "../types";
import { personSearchText } from "@/lib/search/personSearch";

/**
 * Las citas enlazadas: las que salieron de un mismo agendamiento o se
 * enlazaron a mano. El panel las enseña todas —se elige cuál se mira; su
 * detalle y sus acciones van debajo—, suma su total, deja sacar una del
 * grupo y resaltarlas en la agenda. `LinkPicker` enlaza la cita con otra del
 * día, esté o no en un grupo.
 */

/** Lo que el panel de una cita necesita para sus citas enlazadas. */
export interface AppointmentLinkProps {
  /** Las citas enlazadas con ella (ella incluida), en orden; vacío si va suelta. */
  linked?: readonly Appointment[];
  /** Con qué otras citas del día se puede enlazar. */
  linkCandidates?: readonly Appointment[];
  /** Mirar otra cita del grupo. */
  onSelectAppointment?: (appointment: Appointment) => void;
  onUnlink?: (appointment: Appointment) => void;
  onLink?: (appointment: Appointment, target: Appointment) => void;
  /** Resaltar las enlazadas en la agenda. */
  onShowLinked?: () => void;
}

export interface AppointmentLinkSectionProps {
  linked: readonly Appointment[];
  current: Appointment;
  ctx: ModelContext;
  onSelect: (appointment: Appointment) => void;
  onUnlink?: (appointment: Appointment) => void;
  onShowLinked?: () => void;
  /** Sin su título ni «Ver en la agenda»: los pone afuera quien la abre (la tarjeta del panel). */
  bare?: boolean;
}

const servicesLabel = (appointment: Appointment, ctx: ModelContext) => servicesOf(ctx.catalog, appointment).map((service) => service.name).join(" + ") || "—";

export function AppointmentLinkSection({ linked, current, ctx, onSelect, onUnlink, onShowLinked, bare = false }: AppointmentLinkSectionProps) {
  const t = useAppT();
  const total = linked.reduce((sum, item) => sum + appointmentTotal(ctx.catalog, item), 0);

  return (
    <section aria-label={t("calendar.link.title", { count: linked.length })} className="space-y-2" data-testid="appointment-linked">
      <div className={bare ? "hidden" : "flex items-center justify-between gap-2"}>
        <Text variant="label" weight="semibold">
          {t("calendar.link.title", { count: linked.length })}
        </Text>
        {onShowLinked && (
          <Button variant="ghost" size="xs" onClick={onShowLinked} data-testid="appointment-linked-show">
            <CalendarSearch /> {t("calendar.link.show")}
          </Button>
        )}
      </div>
      <ListItemGroup>
        {linked.map((item) => {
          const services = servicesOf(ctx.catalog, item);
          // Si el grupo trae a otra persona (la familia), se dice quién es.
          const other = item.clientId !== current.clientId ? findClient(ctx.catalog, item.clientId)?.name : null;
          return (
            <ListItem
              key={item.id}
              size="sm"
              selected={item.id === current.id}
              onClick={() => onSelect(item)}
              leading={<ServiceThumb service={services[0]} />}
              title={servicesLabel(item, ctx)}
              description={[appointmentRange(item, ctx.intl), findBarber(ctx.catalog, item.barberId)?.name, other].filter(Boolean).join(" · ")}
              meta={ctx.formatMoney(appointmentTotal(ctx.catalog, item))}
              actions={
                onUnlink && (
                  <Button size="icon-xs" variant="ghost" aria-label={`${t("calendar.link.unlink")}: ${servicesLabel(item, ctx)}, ${appointmentRange(item, ctx.intl)}`} onClick={() => onUnlink(item)} data-testid="appointment-linked-unlink">
                    <Unlink />
                  </Button>
                )
              }
              data-testid="appointment-linked-item"
            />
          );
        })}
      </ListItemGroup>
      <DetailRow plain strong label={t("calendar.link.total")}>
        <span data-testid="appointment-linked-total">{ctx.formatMoney(total)}</span>
      </DetailRow>
    </section>
  );
}

export interface LinkPickerProps {
  current: Appointment;
  candidates: readonly Appointment[];
  ctx: ModelContext;
  onLink: (appointment: Appointment, target: Appointment) => void;
}

/** Enlazar la cita con otra del día: se busca por cliente o barbero. */
export function LinkPicker({ current, candidates, ctx, onLink }: LinkPickerProps) {
  const t = useAppT();
  return (
    <div data-testid="appointment-link-picker">
      <SearchableSelect
        value=""
        onValueChange={(id) => {
          const target = candidates.find((item) => item.id === id);
          if (target) onLink(current, target);
        }}
        placeholder={t("calendar.link.pick")}
        searchPlaceholder={t("calendar.link.search")}
        emptyMessage={t("calendar.link.none")}
        disabled={candidates.length === 0}
        options={candidates.map((item) => {
          const client = findClient(ctx.catalog, item.clientId);
          const name = client?.name ?? t("calendar.clientType.walkin");
          return {
            value: item.id,
            label: `${name} · ${appointmentRange(item, ctx.intl)}`,
            description: [findBarber(ctx.catalog, item.barberId)?.name, servicesLabel(item, ctx)].filter(Boolean).join(" · "),
            keywords: client ? personSearchText(client) : undefined,
            leading: <ClientAvatar client={client} name={name} size="sm" />,
          };
        })}
      />
    </div>
  );
}
