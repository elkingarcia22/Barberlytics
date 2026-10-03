import * as React from "react";
import { format } from "date-fns";
import { CalendarPlus, ListOrdered, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, SidePanelShell } from "@/components/overlays";
import { Field, SearchableSelect } from "@/components/forms";
import { DatePicker } from "@/components/date";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { QueryBoundary } from "@/lib/query";
import { PersonAvatar } from "./calendarShared";
import { clockLabel, halfHourOptions, useOpenKey } from "./calendarFormat";
import { findBarber, findClient, type ModelContext } from "./calendarModel";
import { useAddToWaitlist, useRemoveFromWaitlist, useWaitlistQuery } from "./queries";
import { Badge } from "@/components/ui/badge";
import { formatClock } from "@/components/scheduling";
import { waitlistMatch, type WaitlistMatch } from "./dayBrief";
import { CLIENT_TYPE_KEYS, type CalendarDay, type WaitlistEntry } from "./types";

/**
 * La lista de espera: quién espera un hueco, para qué servicio, con quién y
 * en qué franjas le sirve. Desde aquí se le agenda cuando se libera algo.
 */

export interface WaitlistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  ctx: ModelContext;
  date: Date;
  /** La agenda del día que se mira: con ella se sabe a quién se le puede ofrecer un hueco ya. */
  day?: CalendarDay;
  onSchedule: (entry: WaitlistEntry, match?: WaitlistMatch) => void;
}

interface DraftSlot {
  date: Date | null;
  time: string;
}

const HOURS = halfHourOptions(8, 24);

export function WaitlistDrawer(props: WaitlistDrawerProps) {
  return <WaitlistPanel key={useOpenKey(props.open)} {...props} />;
}

function WaitlistPanel({ open, onOpenChange, branchId, ctx, date, day, onSchedule }: WaitlistDrawerProps) {
  const t = useAppT();
  const { current, formatDate } = useLocale();
  const query = useWaitlistQuery(branchId, null, open);
  const add = useAddToWaitlist();
  const remove = useRemoveFromWaitlist();
  const [adding, setAdding] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [barberId, setBarberId] = React.useState("any");
  const [slots, setSlots] = React.useState<DraftSlot[]>([{ date, time: "10:00" }]);

  const submit = () => {
    add.mutate(
      {
        branchId,
        clientId,
        serviceId,
        barberId: barberId === "any" ? null : barberId,
        slots: slots.filter((slot) => slot.date).map((slot) => ({ date: format(slot.date as Date, "yyyy-MM-dd"), time: slot.time })),
      },
      {
        onSuccess: () => {
          toast.success(t("calendar.waitlist.added"));
          setAdding(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.waitlist.title")} description={t("calendar.waitlist.hint")}>
      <div className="space-y-3" data-testid="waitlist-drawer">
        <DrawerSection
          icon={ListOrdered}
          tone="brand"
          title={t("calendar.waitlist.title")}
          hint={t("calendar.waitlist.hint")}
          action={
            <Button size="xs" variant="outline" onClick={() => setAdding((value) => !value)} data-testid="waitlist-add">
              <Plus /> {t("calendar.waitlist.add")}
            </Button>
          }
        >
          <div className="space-y-3">
            {adding && (
              <div className="space-y-3 rounded-lg bg-surface-subtle p-3">
                <Field label={t("calendar.field.client")} required>
                  <SearchableSelect
                    value={clientId}
                    onValueChange={setClientId}
                    placeholder={t("calendar.create.pickClient")}
                    options={ctx.catalog.clients.filter((client) => client.type !== "walkin").map((client) => ({ value: client.id, label: client.name, description: `${client.phone} · ${t(CLIENT_TYPE_KEYS[client.type])}` }))}
                  />
                </Field>
                <Field label={t("calendar.field.service")} required>
                  <SearchableSelect
                    value={serviceId}
                    onValueChange={setServiceId}
                    placeholder={t("calendar.create.pickService")}
                    options={ctx.catalog.services.map((item) => ({ value: item.id, label: item.name, description: t("calendar.create.durationPrice", { minutes: item.durationMin, price: ctx.formatMoney(item.price) }) }))}
                  />
                </Field>
                <Field label={t("calendar.field.barber")}>
                  <Select value={barberId} onValueChange={setBarberId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("calendar.waitlist.anyBarber")}</SelectItem>
                      {ctx.catalog.barbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {slots.map((slot, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-2">
                    <DatePicker label={t("calendar.waitlist.slot", { n: index + 1 })} value={slot.date} onChange={(value) => setSlots((list) => list.map((item, i) => (i === index ? { ...item, date: value ?? null } : item)))} locale={current.intl} />
                    <Field label={t("calendar.walkInSale.time")}>
                      <Select value={slot.time} onValueChange={(value) => setSlots((list) => list.map((item, i) => (i === index ? { ...item, time: value } : item)))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {clockLabel(hour, ctx.intl)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                ))}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSlots((list) => [...list, { date, time: "10:00" }])}>
                    <Plus /> {t("calendar.waitlist.addSlot")}
                  </Button>
                  <Button size="sm" onClick={submit} disabled={!clientId || !serviceId || add.isPending} data-testid="waitlist-confirm">
                    {t("calendar.waitlist.confirm")}
                  </Button>
                </div>
              </div>
            )}

            <QueryBoundary query={query} empty={{ when: (data) => data.items.length === 0, render: <EmptyState icon="task" title={t("calendar.waitlist.empty")} /> }}>
              {(data) => (
                <ListItemGroup>
                  {data.items.map((entry) => {
                    const client = findClient(ctx.catalog, entry.clientId);
                    const service = ctx.catalog.services.find((item) => item.id === entry.serviceId);
                    const barber = findBarber(ctx.catalog, entry.barberId);
                    const name = client?.name ?? "";
                    const match = day ? waitlistMatch(entry, day, ctx.catalog, date, ctx.now) : null;
                    return (
                      <ListItem
                        key={entry.id}
                        leading={<PersonAvatar name={name} />}
                        title={name}
                        description={`${service?.name ?? ""} · ${barber?.name ?? t("calendar.waitlist.anyBarber")} · ${entry.slots.map((slot) => `${formatDate(new Date(`${slot.date}T00:00:00`), { day: "numeric", month: "short" })} ${clockLabel(slot.time, ctx.intl)}`).join(", ")}`}
                        meta={match ? <Badge variant="secondary">{t("calendar.waitlist.match", { time: formatClock(match.start, ctx.intl), barber: match.barber.name.split(" ")[0] })}</Badge> : undefined}
                        actions={
                          <>
                            {match ? (
                              <Button size="xs" onClick={() => onSchedule(entry, match)} data-testid={`waitlist-offer-${entry.id}`}>
                                <CalendarPlus /> {t("calendar.waitlist.offer")}
                              </Button>
                            ) : (
                              <Button size="icon-sm" variant="ghost" aria-label={`${t("calendar.waitlist.schedule")}: ${name}`} onClick={() => onSchedule(entry)}>
                                <CalendarPlus />
                              </Button>
                            )}
                            <Button size="icon-sm" variant="ghost" aria-label={`${t("calendar.waitlist.remove")}: ${name}`} onClick={() => remove.mutate(entry.id)}>
                              <Trash2 />
                            </Button>
                          </>
                        }
                      />
                    );
                  })}
                </ListItemGroup>
              )}
            </QueryBoundary>
          </div>
        </DrawerSection>
        <Text variant="caption">{t("calendar.waitlist.hint")}</Text>
      </div>
    </SidePanelShell>
  );
}
