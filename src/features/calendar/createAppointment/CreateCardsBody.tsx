import * as React from "react";
import { useAppT } from "@/app/i18n";
import { SelectableRow } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { durationLabel } from "../calendarModel";
import { ClientAvatar, PersonAvatar, ServiceThumb } from "../calendarShared";
import { CLIENT_TYPE_KEYS, REPEAT_KEYS } from "../types";
import { InlineList, PanelField, PanelQuestion } from "../appointmentPanel/bookingStyle";
import { useWhenLabel } from "./createModel";
import { ClientPicker } from "./ClientPicker";
import { ExtrasCard, SubmitButton, TotalLine } from "./createSummary";
import { SuggestedSlots, TimeChooser, TimeProblems } from "./createTime";
import { barberPrice, type CreateDraft } from "./useCreateDraft";
import type { CreateBodyProps } from "./createBody";
import { PanelFooter } from "@/components/overlays";

/**
 * «Crear cita» como «Arma la cita» (la que eligió el usuario el 2026-10-19 entre
 * cinco propuestas): la cara del panel de una cita (Tarjeta + Arma la cita). Una tarjeta teñida con la cita que se va formando arriba —día,
 * hora y con quién— y debajo las mismas preguntas del panel, «¿Quién viene?» y
 * «¿Qué se va a hacer?», cada una un campo con foto que abre su lista en su
 * sitio. Al elegir, se abre solo el siguiente campo que falta; al final, un
 * solo botón que dice lo que va a pasar.
 */

type Field = "client" | "services" | "barber" | "start" | "extras";

const NEXT: Record<CreateDraft["missing"][number], Field> = { client: "client", services: "services", barber: "barber", start: "start" };

export function CreateCardsBody({ draft, branchId, onCreateClient }: CreateBodyProps) {
  const t = useAppT();
  const when = useWhenLabel();
  // Arranca abierto lo primero que falta: tocar un hueco deja barbero y hora, y lo que sigue es el cliente.
  const [open, setOpen] = React.useState<Field | null>(draft.missing[0] ? NEXT[draft.missing[0]] : null);
  const toggle = (field: Field) => setOpen((current) => (current === field ? null : field));
  // Elegido algo, se abre lo siguiente que falta (sin contar lo que se acaba de elegir).
  const advance = (done: CreateDraft["missing"][number]) => {
    const next = draft.missing.find((item) => item !== done);
    setOpen(next ? NEXT[next] : null);
  };
  const { client, barber, services } = draft;
  const firstName = barber?.name.split(" ")[0] ?? "";
  const extras = [draft.walkIn && t("calendar.create.walkInSwitch"), draft.repeat !== "none" && t(REPEAT_KEYS[draft.repeat]), draft.notes.trim() && t("calendar.createV.withNote")].filter(Boolean).join(" · ");

  return (
    <section className="-mx-1 flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-3 sm:mx-0 sm:p-4" data-testid="create-cards">
      <div className="flex flex-col gap-1">
        <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
          {t("calendar.createV.newAppointment")}
        </Text>
        <Heading level={2} className="tabular-nums">
          {draft.start ? when(draft.start, draft.now, draft.ctx.intl) : t("calendar.createV.noTimeYet")}
        </Heading>
        <Text size="sm" tone="secondary">
          {draft.start && barber ? t("calendar.createV.withBarber", { name: barber.name, duration: durationLabel(draft.durationMin) }) : t("calendar.createV.cardsLead")}
        </Text>
      </div>

      <PanelQuestion title={t("calendar.panel.cards.who")}>
        <PanelField
          eyebrow={t("calendar.panel.fields.client")}
          value={client?.name ?? ""}
          placeholder={t("calendar.create.pickClient")}
          detail={client ? `${t(CLIENT_TYPE_KEYS[client.type])} · ${client.phone}` : undefined}
          leading={client ? <ClientAvatar client={client} /> : undefined}
          icon="users"
          round
          open={open === "client"}
          onOpen={() => toggle("client")}
          testId="create-field-client"
        />
        {open === "client" && <ClientList draft={draft} onCreateClient={onCreateClient} onClose={() => setOpen(null)} onPicked={() => advance("client")} />}
      </PanelQuestion>

      <PanelQuestion title={t("calendar.panel.cards.what")}>
        <div className="flex flex-col gap-2">
          <PanelField
            eyebrow={t("calendar.panel.fields.services")}
            value={services.map((service) => service.name).join(" + ")}
            placeholder={t("calendar.create.pickService")}
            detail={services.length > 0 ? `${durationLabel(draft.durationMin)} · ${draft.ctx.formatMoney(draft.price)}` : undefined}
            imageUrl={services[0]?.imageUrl}
            icon="scissors"
            open={open === "services"}
            onOpen={() => toggle("services")}
            testId="create-field-services"
          />
          {open === "services" && <ServiceList draft={draft} onClose={() => setOpen(null)} onDone={() => advance("services")} />}
          <PanelField
            eyebrow={t("calendar.panel.fields.barber")}
            value={barber?.name ?? ""}
            placeholder={t("calendar.create.pickBarber")}
            detail={barber ? (draft.client?.preferredBarberId === barber.id ? t("calendar.createV.usualBarber") : (barber.level ?? undefined)) : undefined}
            leading={barber ? <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} /> : undefined}
            icon="users"
            round
            open={open === "barber"}
            onOpen={draft.fixedBarberId ? undefined : () => toggle("barber")}
            locked={Boolean(draft.fixedBarberId)}
            lockedHint={t("calendar.createV.ownColumn")}
            testId="create-appointment-barber"
          />
          {open === "barber" && <BarberList draft={draft} onClose={() => setOpen(null)} onPicked={() => advance("barber")} />}
          <PanelField
            eyebrow={t("calendar.panel.fields.when")}
            value={draft.start ? when(draft.start, draft.now, draft.ctx.intl) : ""}
            placeholder={t("calendar.createV.pickTime")}
            detail={draft.start ? durationLabel(draft.durationMin) : undefined}
            icon="calendar"
            open={open === "start"}
            onOpen={() => toggle("start")}
            testId="create-field-when"
          />
          {open === "start" && (
            <InlineList title={t("calendar.panel.fields.whenTitle")} description={firstName ? t("calendar.panel.fields.whenHint", { name: firstName }) : undefined} onClose={() => setOpen(null)}>
              <div className="flex flex-col gap-4">
                <SuggestedSlots draft={draft} />
                <TimeChooser draft={draft} branchId={branchId} anyBarber={!draft.barberId && !draft.fixedBarberId} bare onPick={(time) => {
                  draft.place(draft.barberId && time.barberIds.includes(draft.barberId) ? draft.barberId : time.barberIds[0], time.start);
                  advance("start");
                }} />
              </div>
            </InlineList>
          )}
          {open !== "start" && <TimeProblems draft={draft} />}
        </div>
      </PanelQuestion>

      <PanelQuestion title={t("calendar.createV.forBarber")}>
        <PanelField eyebrow={t("calendar.create.more")} value={extras} placeholder={t("calendar.createV.extrasPlaceholder")} icon="edit" open={open === "extras"} onOpen={() => toggle("extras")} testId="create-field-extras" />
        {open === "extras" && (
          <InlineList title={t("calendar.create.more")} description={t("calendar.create.moreHint")} onClose={() => setOpen(null)}>
            <ExtrasCard draft={draft} className="border-0 px-1" />
          </InlineList>
        )}
      </PanelQuestion>

      <PanelFooter>
        <TotalLine draft={draft} />
        <SubmitButton draft={draft} />
      </PanelFooter>
    </section>
  );
}

function ClientList({ draft, onCreateClient, onClose, onPicked }: { draft: CreateDraft; onCreateClient: () => void; onClose: () => void; onPicked: () => void }) {
  const t = useAppT();
  return (
    <ClientPicker
      clients={draft.ctx.catalog.clients}
      selectedId={draft.clientId}
      onPick={(clientId) => {
        draft.setClientId(clientId);
        onPicked();
      }}
      onClose={onClose}
      footer={
        <Button variant="outline" className="flex-1" onClick={onCreateClient}>
          <ThemaIcon name="userAdd" />
          {t("calendar.create.createClient")}
        </Button>
      }
    />
  );
}

function ServiceList({ draft, onClose, onDone }: { draft: CreateDraft; onClose: () => void; onDone: () => void }) {
  const t = useAppT();
  return (
    <InlineList
      title={t("calendar.panel.fields.servicesTitle")}
      description={t("calendar.panel.fields.servicesHint")}
      onClose={onClose}
      footer={
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <Text size="xs" tone="muted">
              {t("calendar.panel.fields.servicesCount", { count: draft.services.length, minutes: draft.durationMin })}
            </Text>
            <Text weight="semibold" tabular>
              {draft.ctx.formatMoney(draft.price)}
            </Text>
          </span>
          <Button onClick={onDone} disabled={draft.services.length === 0} data-testid="create-services-done">
            {t("calendar.createV.done")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2" role="group">
        {draft.ctx.catalog.services.map((service) => (
          <SelectableRow key={service.id} role="checkbox" checked={draft.serviceIds.includes(service.id)} label={service.name} leading={<ServiceThumb service={service} size="md" />} onClick={() => draft.toggleService(service.id)}>
            <span className="flex flex-col">
              <Text as="span" weight="medium">
                {service.name}
              </Text>
              <Text as="span" size="xs" tone="muted" tabular>
                {durationLabel(service.durationMin)} · {draft.ctx.formatMoney(barberPrice(draft.barber, [service]))}
              </Text>
            </span>
          </SelectableRow>
        ))}
      </div>
    </InlineList>
  );
}

function BarberList({ draft, onClose, onPicked }: { draft: CreateDraft; onClose: () => void; onPicked: () => void }) {
  const t = useAppT();
  return (
    <InlineList title={t("calendar.panel.fields.barberTitle")} description={t("calendar.createV.barberHint")} onClose={onClose}>
      <div className="flex flex-col gap-2" role="radiogroup">
        {[...draft.ctx.catalog.barbers].sort((a, b) => Number(b.id === draft.client?.preferredBarberId) - Number(a.id === draft.client?.preferredBarberId)).map((barber) => (
          <SelectableRow
            key={barber.id}
            role="radio"
            checked={barber.id === draft.barberId}
            label={barber.name}
            leading={<PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} />}
            onClick={() => {
              draft.setBarberId(barber.id);
              onPicked();
            }}
          >
            <span className="flex flex-col">
              <Text as="span" weight="medium">
                {barber.name}
              </Text>
              <Text as="span" size="xs" tone="muted" tabular>
                {[draft.client?.preferredBarberId === barber.id ? t("calendar.createV.usualBarber") : barber.level, draft.services.length > 0 ? draft.ctx.formatMoney(barberPrice(barber, draft.services)) : null].filter(Boolean).join(" · ")}
              </Text>
            </span>
          </SelectableRow>
        ))}
      </div>
    </InlineList>
  );
}
