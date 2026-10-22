import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";
import type { ModelContext } from "../calendarModel";
import { ClientAvatar } from "../calendarShared";
import { matchesPerson } from "@/lib/search/personSearch";
import { CLIENT_TYPE_KEYS, type Appointment, type AppointmentPatch } from "../types";
import { ClientSummaryRow, Fact } from "./ClientPage";
import { ActionButton } from "./PanelParts";
import { InlineList, PanelField } from "./bookingStyle";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * El cliente como una tarjeta más de la cita, como el servicio o el barbero:
 * foto, nombre, tipo y celular. Abierta, «Sobre {nombre}» es su resumen: su
 * última nota (la actitud y la salud ya van en las etiquetas de arriba), luego lo que se pregunta en el mostrador (membresía y ritmo, visitas,
 * barbero de siempre, contacto) y el paso a su página, donde está todo. Se puede cambiar de cliente (se agendó a
 * otro, o a nombre de quien llamó) hasta cobrar; el barbero de comisión, solo
 * mientras no ha llegado.
 */

/** Cuántos se listan a la vez al buscar: el resto aparece al afinar la búsqueda. */
const LIST_LIMIT = 30;

type Mode = "about" | "change";

export interface ClientFieldProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onOpenPage: () => void;
  /** Sin él (la cita cobrada o cerrada), el cliente no se cambia. */
  onPatch?: (appointment: Appointment, patch: AppointmentPatch) => void;
}

export function ClientField({ model, ctx, onOpenPage, onPatch }: ClientFieldProps) {
  const t = useAppT();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const { known } = model;
  // Mientras no ha llegado, siempre; ya en la barbería, todos menos el barbero de comisión (hasta cobrar).
  const canChange = Boolean(onPatch) && (model.appointment.status === "scheduled" || (model.unpaid && !(ctx.access?.locksAfterCheckIn ?? false)));
  const close = () => setMode(null);
  // Sin ficha (sin cita previa), abrirla es elegir a quién se le pone.
  const openMode: Mode | null = known ? "about" : canChange ? "change" : null;

  return (
    <>
      <PanelField
        eyebrow={t("calendar.panel.fields.client")}
        value={model.clientName}
        // La membresía ya va en las etiquetas de arriba: aquí, el tipo y cómo ubicarlo.
        detail={known ? [t(CLIENT_TYPE_KEYS[known.type]), model.phone ? known.phone : null].filter(Boolean).join(" · ") : t("calendar.panel.client.walkInHint")}
        leading={<ClientAvatar client={model.client} name={model.clientName} />}
        round
        open={mode !== null}
        onOpen={openMode ? () => setMode((current) => (current ? null : openMode)) : undefined}
        testId="panel-field-client"
      />
      {mode === "about" && known && <ClientAbout model={model} ctx={ctx} onOpenPage={onOpenPage} onChange={canChange ? () => setMode("change") : undefined} onClose={close} />}
      {mode === "change" && onPatch && <ClientList model={model} ctx={ctx} onPatch={onPatch} onClose={close} />}
    </>
  );
}

function ClientAbout({ model, ctx, onOpenPage, onChange, onClose }: { model: AppointmentModel; ctx: ModelContext; onOpenPage: () => void; onChange?: () => void; onClose: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const known = model.known!;
  const preferred = known.preferredBarberId ? ctx.catalog.barbers.find((barber) => barber.id === known.preferredBarberId) : undefined;
  const daysSince = model.lastVisit ? differenceInCalendarDays(ctx.now ?? new Date(), model.lastVisit) : null;
  return (
    <InlineList
      title={t("calendar.panel.client.about", { name: model.firstName })}
      onClose={onClose}
      footer={
        <>
          {onChange && (
            <Button variant="outline" className="flex-1" onClick={onChange} data-testid="panel-client-change">
              <ThemaIcon name="refresh" />
              {t("calendar.panel.client.change")}
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onOpenPage} data-testid="panel-client-more">
            {t("calendar.panel.client.seeAll")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3" data-testid="panel-client-who">
        <ClientSummaryRow model={model} onOpen={onOpenPage} />
        <ClientLatestNote model={model} />
        <div className="px-1">
          <Fact label={t("calendar.panel.client.visits")} value={String(known.visits)} />
          <Fact label={t("calendar.client.lastVisit")} value={model.lastVisit ? `${formatDate(model.lastVisit, { day: "numeric", month: "short" })}${daysSince !== null ? ` · ${t("calendar.panel.client.lastValue", { days: daysSince })}` : ""}` : "—"} />
          <Fact label={t("calendar.panel.client.usualBarberLabel")} value={preferred?.name ?? t("calendar.loyalty.noPreference")} />
          {model.phone && (
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="flex min-w-0 flex-col">
                <Text size="sm" tone="secondary" tabular>
                  {known.phone}
                </Text>
                <Text size="xs" tone="muted" truncate>
                  {model.email || t("calendar.panel.write.noEmail")}
                </Text>
              </span>
              <span className="flex shrink-0 gap-1">
                <ActionButton model={model} action="call" variant="ghost" size="sm" iconOnly />
                <ActionButton model={model} action="message" variant="ghost" size="sm" iconOnly />
              </span>
            </div>
          )}
        </div>
      </div>
    </InlineList>
  );
}

/**
 * Su última nota (el resto, en su página). La actitud, alergias y medicamentos
 * no se repiten aquí: ya van en las etiquetas y alertas de arriba de la cita.
 */
function ClientLatestNote({ model }: { model: AppointmentModel }) {
  const t = useAppT();
  const [latest, ...older] = model.notes;
  if (!latest) return null;
  return (
    <section aria-label={t("calendar.panel.client.latestNote")} className="flex flex-col gap-0.5 rounded-xl bg-surface-subtle px-3 py-2" data-testid="panel-client-important">
      <Text size="xs" tone="muted">
        {t("calendar.panel.client.latestNote")}
      </Text>
      <Text size="sm" className="line-clamp-2">
        {latest.text}
      </Text>
      {older.length > 0 && (
        <Text size="xs" tone="muted">
          {t("calendar.panel.client.moreNotes", { count: older.length })}
        </Text>
      )}
    </section>
  );
}

/** Elegir otro cliente para la cita: buscar por nombre o celular y tocarlo. */
function ClientList({ model, ctx, onPatch, onClose }: { model: AppointmentModel; ctx: ModelContext; onPatch: NonNullable<ClientFieldProps["onPatch"]>; onClose: () => void }) {
  const t = useAppT();
  const [query, setQuery] = React.useState("");
  const matches = ctx.catalog.clients.filter((client) => client.type !== "walkin" && matchesPerson(client, query));
  const pick = (clientId: string) => {
    if (clientId !== model.appointment.clientId) onPatch(model.appointment, { clientId });
    onClose();
  };
  return (
    <InlineList title={t("calendar.panel.client.changeTitle")} description={t("calendar.panel.client.changeHint")} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Input type="search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("calendar.panel.client.searchPlaceholder")} aria-label={t("calendar.panel.client.searchPlaceholder")} data-testid="panel-client-search" />
        {matches.length === 0 ? (
          <Text size="sm" tone="muted" className="px-1 py-2">
            {t("calendar.panel.client.noMatch", { query: query.trim() })}
          </Text>
        ) : (
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("calendar.panel.client.changeTitle")}>
            {matches.slice(0, LIST_LIMIT).map((client) => (
              <SelectableRow key={client.id} role="radio" checked={client.id === model.appointment.clientId} label={client.name} leading={<ClientAvatar client={client} />} onClick={() => pick(client.id)}>
                <span className="flex flex-col">
                  <Text as="span" weight="medium">
                    {client.name}
                  </Text>
                  <Text as="span" size="xs" tone="muted" tabular>
                    {`${t(CLIENT_TYPE_KEYS[client.type])} · ${client.phone}`}
                  </Text>
                </span>
              </SelectableRow>
            ))}
          </div>
        )}
      </div>
    </InlineList>
  );
}
