import * as React from "react";
import { Cake, CalendarClock, CreditCard, HeartPulse, Mail, MapPin, Pencil, Phone, Plus, Store, UserRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { MetricCard } from "@/components/charts";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { NOTE_KIND_KEYS, noteKindSchema, type NoteKind } from "@/features/calendar/types";
import { ClientNoteList, NoteKindChips } from "@/features/calendar/clientNotes/ClientNotes";
import { InfoCard, InfoRow, Stat } from "@/features/team/teamShared";
import { CustomerContactLog, CustomerWallet } from "./CustomerRelationship";
import { APPOINTMENT_STATUS_BADGE, branchName, daysToBirthday, formatAgo, maskPhone } from "./customersUtils";
import { APPOINTMENT_STATUS_KEYS, type CustomerAppointment, type CustomerDetail } from "./types";

const DATE_LONG: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const DATE_TIME: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
const BIRTHDAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };

export interface CustomerOverviewProps {
  customer: CustomerDetail;
  formatMoney: (value: number) => string;
  onAddNote: () => void;
  /** Sin permiso de edición no llega y el botón no aparece. */
  onEdit?: () => void;
  onSeeAppointments: () => void;
  /** Teléfono, correo, dirección y notas médicas (`client-info`·active). */
  showContact?: boolean;
  /** Valor de vida, ticket e importes: recepción no los ve. */
  showMoney?: boolean;
}

/**
 * El resumen de un cliente: lo que hay que saber antes de atenderle arriba
 * —alergias y medicamentos—, cuánto vale y cómo se porta con sus citas, qué
 * viene ahora, sus notas y sus datos. Todo en una pantalla: el perfil ya no
 * es una pestaña aparte. Lo reservado (contacto, notas médicas, dinero) se
 * omite según el rol de quien mira.
 */
export function CustomerOverview({ customer, formatMoney, onAddNote, onEdit, onSeeAppointments, showContact = true, showMoney = true }: CustomerOverviewProps) {
  const t = useAppT();
  const { formatNumber, formatDate, formatRelativeTime } = useLocale();
  const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
  const medical = showContact ? customer.notes.filter((note) => note.kind !== "note") : [];
  const next = customer.appointments.find((item) => item.status === "scheduled");
  const last = customer.appointments.find((item) => item.id === customer.lastAppointmentId);
  const birthdayIn = daysToBirthday(customer.birthDate);
  const place = [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-section">
      {medical.length > 0 && (
        <Alert className="border-status-warning/30 bg-status-warning/10" data-testid="customer-medical">
          <HeartPulse className="text-status-warning" />
          <AlertTitle>{t("customers.overview.medicalTitle")}</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {medical.map((note) => (
                <li key={note.id}>
                  <span className="font-medium text-text-primary">{t(NOTE_KIND_KEYS[note.kind])}:</span> {note.text}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <section aria-label={t("customers.overview.valueAria")} className={showMoney ? "grid gap-stack sm:grid-cols-2 xl:grid-cols-4" : "grid gap-stack sm:grid-cols-2"} data-testid="customer-value">
        {showMoney && (
          <>
            <MetricCard label={t("customers.overview.ltv")} value={formatMoney(customer.ltv)} caption={t("customers.overview.ltvCaption", { count: customer.stats.transactions })} hint={t("customers.overview.ltvHint")} tone="brand" icon="chart" />
            <MetricCard label={t("customers.overview.avgTicket")} value={customer.stats.avgTicket === 0 ? "—" : formatMoney(customer.stats.avgTicket)} caption={t("customers.overview.avgTicketCaption")} tone="positive" icon="file" />
          </>
        )}
        <MetricCard label={t("customers.overview.visits")} value={formatNumber(customer.visits)} caption={customer.lastVisitAt ? t("customers.overview.lastVisit", { when: formatAgo(customer.lastVisitAt, formatRelativeTime) }) : t("customers.neverVisited")} tone="brand" icon="calendar" />
        <MetricCard
          label={t("customers.overview.frequency")}
          value={customer.visitEveryDays === null ? "—" : t("customers.everyDays", { count: customer.visitEveryDays })}
          caption={customer.visitEveryDays === null ? t("customers.overview.frequencyEmpty") : t("customers.overview.frequencyCaption")}
          hint={t("customers.overview.frequencyHint")}
          tone="warning"
          icon="clock"
        />
      </section>

      <div className="grid items-start gap-stack lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-stack">
          <InfoCard title={t("customers.overview.reliability")} description={t("customers.overview.reliabilityHint")}>
            <ReliabilityBar completed={customer.stats.completedRate} cancelled={customer.stats.cancelledRate} noShow={customer.stats.noShowRate} format={percent} />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label={t("customers.overview.rebook")}>{customer.visits < 2 ? "—" : percent(customer.stats.rebookRate)}</Stat>
              <Stat label={t("customers.overview.leadTime")}>{customer.stats.leadTimeDays === 0 ? "—" : t("customers.overview.leadTimeValue", { count: customer.stats.leadTimeDays })}</Stat>
              <Stat label={t("customers.column.barber")}>{customer.preferredBarber ?? t("customers.noPreference")}</Stat>
            </div>
          </InfoCard>

          <CustomerNotes customer={customer} onAddNote={onAddNote} showMedical={showContact} />

          <CustomerContactLog customerId={customer.id} />
        </div>

        <div className="space-y-stack">
          <InfoCard
            title={next ? t("customers.overview.nextAppointment") : t("customers.overview.lastAppointment")}
            actions={
              <Button size="xs" variant="ghost" onClick={onSeeAppointments}>
                {t("customers.overview.seeAll")}
              </Button>
            }
          >
            {next || last ? <AppointmentSummary appointment={(next ?? last) as CustomerAppointment} formatMoney={showMoney ? formatMoney : null} /> : <Text variant="muted">{t("customers.overview.noAppointments")}</Text>}
          </InfoCard>

          <CustomerWallet customerId={customer.id} formatMoney={formatMoney} showMoney={showMoney} showContact={showContact} />

          <InfoCard
            title={t("customers.overview.contact")}
            description={showContact ? undefined : t("customers.profile.contactHidden")}
            actions={
              onEdit && (
                <Button size="xs" variant="outline" onClick={onEdit} data-testid="customer-edit-contact">
                  <Pencil /> {t("action.edit")}
                </Button>
              )
            }
          >
            {showContact && (
              <>
                <InfoRow icon={<Phone />} label={t("customers.form.phone")}>
                  <span className="tabular-nums">{maskPhone(customer.phone)}</span>
                </InfoRow>
                <InfoRow icon={<Mail />} label={t("customers.form.email")}>
                  <span className="break-all">{customer.email}</span>
                </InfoRow>
              </>
            )}
            <InfoRow icon={<Store />} label={t("customers.column.branch")}>
              {branchName(customer.branchId)}
            </InfoRow>
            <InfoRow icon={<Cake />} label={t("customers.overview.birthday")}>
              {customer.birthDate === null ? t("customers.overview.notSet") : `${formatDate(new Date(`${customer.birthDate}T12:00:00`), BIRTHDAY)}${birthdayIn !== null && birthdayIn <= 30 ? ` · ${birthdayIn === 0 ? t("customers.overview.birthdayToday") : t("customers.overview.birthdayIn", { count: birthdayIn })}` : ""}`}
            </InfoRow>
            {showContact && (
              <InfoRow icon={<MapPin />} label={t("customers.form.address")}>
                {place || t("customers.overview.notSet")}
              </InfoRow>
            )}
            <InfoRow icon={<CreditCard />} label={t("customers.form.onlineOnly")}>
              {customer.onlineOnly ? t("customers.overview.onlineOnlyOn") : t("customers.overview.onlineOnlyOff")}
            </InfoRow>
            <InfoRow icon={<UserRound />} label={t("customers.column.since")}>
              {formatDate(new Date(customer.createdAt), DATE_LONG)}
            </InfoRow>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

interface ReliabilityBarProps {
  completed: number;
  cancelled: number;
  noShow: number;
  format: (value: number) => string;
}

/** De cada cien citas que reservó, cuántas cumplió, canceló o dejó plantadas. */
function ReliabilityBar({ completed, cancelled, noShow, format }: ReliabilityBarProps) {
  const t = useAppT();
  const parts = [
    { id: "completed", label: t("customers.overview.completed"), value: completed, bar: "bg-status-positive" },
    { id: "cancelled", label: t("customers.overview.cancelled"), value: cancelled, bar: "bg-status-warning" },
    { id: "noShow", label: t("customers.overview.noShow"), value: noShow, bar: "bg-status-negative" },
  ];
  const total = completed + cancelled + noShow;
  if (total === 0) return <Text variant="muted">{t("customers.overview.reliabilityEmpty")}</Text>;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-subtle" role="img" aria-label={parts.map((part) => `${part.label}: ${format(part.value)}`).join(", ")}>
        {parts.map((part) => (part.value > 0 ? <span key={part.id} className={part.bar} style={{ width: `${(part.value / total) * 100}%` }} /> : null))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {parts.map((part) => (
          <div key={part.id} className="flex items-center gap-inline">
            <span className={`size-2 rounded-full ${part.bar}`} aria-hidden />
            <dt className="text-sm text-text-secondary">{part.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-text-primary">{format(part.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AppointmentSummary({ appointment, formatMoney }: { appointment: CustomerAppointment; formatMoney: ((value: number) => string) | null }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <Text weight="semibold">{appointment.service}</Text>
        <StatusBadge status={APPOINTMENT_STATUS_BADGE[appointment.status]} label={t(APPOINTMENT_STATUS_KEYS[appointment.status])} />
      </div>
      <p className="flex items-center gap-inline text-sm text-text-secondary">
        <CalendarClock className="size-4 shrink-0 text-text-muted" aria-hidden />
        <span className="first-letter:uppercase">{formatDate(new Date(appointment.start), DATE_TIME)}</span>
      </p>
      <Text variant="muted">
        {appointment.barber ?? t("customers.noPreference")}
        {formatMoney && appointment.total > 0 ? ` · ${formatMoney(appointment.total)}` : ""}
      </Text>
    </div>
  );
}

/**
 * Las notas del cliente; sin permiso de información, solo las generales (no alergias ni medicamentos).
 * Filtro y lista son los de la cita (`clientNotes`): cada nota se corrige o se borra desde su menú.
 */
function CustomerNotes({ customer, onAddNote, showMedical }: { customer: CustomerDetail; onAddNote: () => void; showMedical: boolean }) {
  const t = useAppT();
  const [kind, setKind] = React.useState<NoteKind>("note");
  const kinds: readonly NoteKind[] = showMedical ? noteKindSchema.options : ["note"];
  const visible = customer.notes.filter((note) => kinds.includes(note.kind));

  return (
    <InfoCard
      title={t("customers.overview.notes")}
      description={t("customers.overview.notesHint")}
      actions={
        <Button size="xs" variant="outline" onClick={onAddNote} data-testid="customer-add-note">
          <Plus /> {t("calendar.notes.add")}
        </Button>
      }
    >
      <div className="space-y-3">
        {kinds.length > 1 && <NoteKindChips kinds={kinds} value={kind} onChange={setKind} notes={visible} />}
        <ClientNoteList clientId={customer.id} notes={visible.filter((note) => note.kind === kind)} kinds={kinds} data-testid="customer-notes" />
      </div>
    </InfoCard>
  );
}
