import * as React from "react";
import { startOfDay } from "date-fns";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Field, InputOtp, PhoneInput } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility/IconTile";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { buildIcs, dayKeyOf, downloadIcs, firstBookableDay, formatPhone, initialsOf, isSameDayAs, parseStart } from "../../bookingFormat";
import { cancellationTerms } from "../../pricing";
import { AppointmentCard } from "../../flow/AppointmentCard";
import { BarberProfileDrawer } from "../../flow/BarberProfileDrawer";
import { useBookingFlow } from "../../flow/BookingContext";
import { CancelDialog } from "../../flow/CancelDialog";
import { LoyaltyCard } from "../../flow/LoyaltyCard";
import { PaymentPanel, PayButton } from "../../flow/PaymentPanel";
import { usePaymentController } from "../../flow/usePaymentController";
import { PersonPicker } from "../../flow/PersonPicker";
import { ProductCard } from "../../flow/ProductCard";
import { ReferencePhotoField } from "../../flow/ReferencePhotoField";
import { RepeatOffer } from "../../flow/RepeatOffer";
import { RescheduleDrawer } from "../../flow/RescheduleDrawer";
import { SendReceiptDialog } from "../../flow/SendReceiptDialog";
import { WaitlistCard } from "../../flow/WaitlistCard";
import { useAvailabilityQuery, useEarliestQuery, useMyAppointmentsQuery } from "../../queries";
import type { BookedAppointment, BookingBarber, Reservation, WaitlistJoined } from "../../types";
import { itemDuration, itemPrice } from "../../useBookingTotals";
import { ableBarbers, windowOf } from "../agenda/agendaModel";
import { AgendaCartLines } from "../agenda/AgendaCart";
import { ProfileForm } from "../agenda/AgendaIdentity";
import { useChatEngine, type ChatWidget } from "./useChatBooking";

const CODE_LENGTH = 6;
const MIN_DIGITS = 10;
/** Los días que se ofrecen como pastillas dentro de la conversación. */
const CHAT_DAYS = 7;
const VISIBLE_TIMES = 12;

/** El marco de una tarjeta con campos. Las que llevan tarjetas dentro van sin marco (nada de caja dentro de caja). */
function Framed({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm", className)}>{children}</div>;
}

function PhoneWidget() {
  const t = useAppT();
  const { state } = useBookingFlow();
  const { actions } = useChatEngine();
  const [phone, setPhone] = React.useState(state.phone);
  const [touched, setTouched] = React.useState(false);
  const isValid = phone.replace(/\D/g, "").length - 2 >= MIN_DIGITS;
  return (
    <Framed>
      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (isValid) actions.submitPhone(phone);
        }}
      >
        <Field label={t("booking.phone.label")} error={touched && !isValid ? t("booking.phone.invalid") : undefined}>
          <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" autoComplete="tel-national" />
        </Field>
        <Button type="submit">
          <ThemaIcon name="smsCode" />
          {t("booking.agenda.id.sendCode")}
        </Button>
      </form>
    </Framed>
  );
}

function CodeWidget() {
  const t = useAppT();
  const { actions } = useChatEngine();
  const [code, setCode] = React.useState("");
  return (
    <Framed>
      <Field label={t("booking.manage.code")}>
        <InputOtp
          length={CODE_LENGTH}
          value={code}
          onChange={setCode}
          onComplete={(value) => {
            actions.submitCode(value);
            setCode("");
          }}
          groups={[3, 3]}
          autoFocus
        />
      </Field>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Button type="button" variant="link" size="sm" className="px-0" onClick={() => void actions.resendCode()}>
          {t("booking.manage.resend")}
        </Button>
        <Button type="button" variant="link" size="sm" className="px-0" onClick={actions.changePhone}>
          {t("booking.verify.changePhone")}
        </Button>
      </div>
    </Framed>
  );
}

function BlockedWidget() {
  const t = useAppT();
  const { shop } = useBookingFlow();
  const { actions } = useChatEngine();
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={`tel:${shop.phone}`}>
          <ThemaIcon name="phone" />
          {t("booking.blocked.call", { phone: formatPhone(shop.phone) })}
        </a>
      </Button>
      <Button type="button" variant="outline" onClick={actions.changePhone}>
        {t("booking.blocked.other")}
      </Button>
    </div>
  );
}

function CallWidget() {
  const t = useAppT();
  const { shop } = useBookingFlow();
  return (
    <Button asChild className="self-start">
      <a href={`tel:${shop.phone}`}>
        <ThemaIcon name="phone" />
        {t("booking.blocked.call", { phone: formatPhone(shop.phone) })}
      </a>
    </Button>
  );
}

/** Quien vuelve: la hora que le toca (por su frecuencia) o lo mismo de la última vez, y su tarjeta de cliente frecuente. */
function HomeWidget() {
  const t = useAppT();
  const { state, catalog, fmt } = useBookingFlow();
  const { suggestion, actions } = useChatEngine();
  const last = state.customer?.lastVisit ?? null;
  const lastBarber = catalog?.barbers.find((barber) => barber.id === last?.barberId);
  return (
    <div className="flex flex-col gap-3">
      {suggestion ? (
        <Framed>
          <Text size="xs" tone="muted">
            {t("booking.chat.pickOne")}
          </Text>
          <div role="group" aria-label={t("booking.chat.pickOne")} className="grid grid-cols-3 gap-2">
            {suggestion.options.map((option) => {
              const when = parseStart(option.start);
              const barber = catalog?.barbers.find((item) => item.id === option.barberId);
              return (
                <button
                  key={option.start + option.barberId}
                  type="button"
                  onClick={() => actions.acceptSuggestion(option)}
                  aria-label={t("booking.suggest.book", { when: fmt.when(when) })}
                  className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-surface px-2 py-2.5 transition-colors duration-fast ease-out-expo hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
                >
                  <Text as="span" size="xs" tone="muted" className="capitalize">
                    {fmt.dayShort(when)}
                  </Text>
                  <Text as="span" size="sm" weight="semibold" tabular className="whitespace-nowrap">
                    {fmt.time(when)}
                  </Text>
                  {barber && (
                    <Text as="span" size="xs" tone={option.sameBarber ? "primary" : "secondary"} truncate className="max-w-full">
                      {barber.name.split(" ")[0]}
                    </Text>
                  )}
                </button>
              );
            })}
          </div>
        </Framed>
      ) : (
        last && (
          <Button type="button" className="self-start" onClick={actions.repeatLast}>
            <ThemaIcon name="refresh" />
            {lastBarber ? t("booking.chat.sameWith", { name: lastBarber.name.split(" ")[0] }) : t("booking.chat.reply.same")}
          </Button>
        )
      )}
      <LoyaltyCard />
    </div>
  );
}

function BranchesWidget() {
  const t = useAppT();
  const { shop, fmt } = useBookingFlow();
  const { actions } = useChatEngine();
  return (
    <ListItemGroup>
      {shop.branches.map((branch) => (
        <ListItem
          key={branch.id}
          leading={<IconTile size="md" src={branch.imageUrl} icon={<ThemaIcon name="building" />} />}
          title={branch.name}
          description={`${branch.address} · ${t("booking.chat.todayHours", { from: fmt.clock(branch.opensAt), to: fmt.clock(branch.closesAt) })}`}
          meta={<ThemaIcon name="chevronRight" size="sm" tone="muted" />}
          onClick={() => actions.chooseBranch(branch.id)}
        />
      ))}
    </ListItemGroup>
  );
}

/** Qué se hace (varios a la vez) y para quién, con lo que dura y cuesta a la vista. */
function ServicesWidget() {
  const t = useAppT();
  const { state, dispatch, catalog, catalogLoading, fmt } = useBookingFlow();
  const { actions } = useChatEngine();
  const selected = state.draft?.serviceIds ?? [];
  return (
    <Framed>
      <PersonPicker />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("booking.agenda.whatLabel")}>
        {catalogLoading
          ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-8 w-24 rounded-full" />)
          : (catalog?.services ?? []).map((service) => (
              <Chip key={service.id} label={service.name} icon={selected.includes(service.id) ? "check" : undefined} selected={selected.includes(service.id)} onClick={() => dispatch({ type: "toggleService", serviceId: service.id })} />
            ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Text size="sm" tone={selected.length > 0 ? "default" : "muted"} tabular>
          {selected.length > 0 ? t("booking.agenda.whatSummary", { minutes: itemDuration(selected, catalog), price: fmt.money(itemPrice({ serviceIds: selected, barberId: null }, catalog)) }) : t("booking.services.pick")}
        </Text>
        <Button type="button" disabled={selected.length === 0} onClick={actions.servicesDone}>
          {t("booking.chat.ready")}
          <ThemaIcon name="arrowRight" />
        </Button>
      </div>
    </Framed>
  );
}

/** Los barberos que hacen lo elegido, deslizables, con su nota y su precio; el perfil, en su hoja. */
function BarbersWidget() {
  const t = useAppT();
  const { state, catalog, fmt } = useBookingFlow();
  const { actions } = useChatEngine();
  const row = useDragScroll<HTMLDivElement>();
  const [profile, setProfile] = React.useState<BookingBarber | null>(null);
  const serviceIds = state.draft?.serviceIds ?? [];
  const usualId = state.customer?.lastVisit?.barberId ?? null;
  const barbers = ableBarbers(catalog?.barbers ?? [], serviceIds, usualId);
  return (
    <>
      <div ref={row} className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {barbers.map((barber) => (
          <div key={barber.id} className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center shadow-sm">
            <Avatar size="lg">
              {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
              <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-center gap-0.5">
              <Text size="sm" weight="semibold" truncate className="max-w-full">
                {barber.name}
              </Text>
              <Text size="xs" tone="secondary" tabular>
                <span className="text-warning" aria-hidden>
                  ★
                </span>{" "}
                {barber.rating.toFixed(1)} · {fmt.money(itemPrice({ serviceIds, barberId: barber.id }, catalog))}
              </Text>
              {barber.id === usualId && <Badge variant="secondary">{t("booking.agenda.yourBarber")}</Badge>}
            </div>
            <Button type="button" size="sm" className="w-full" onClick={() => actions.chooseBarber(barber.id)} aria-label={t("booking.chat.chooseBarber", { name: barber.name })}>
              {t("booking.chat.choose")}
            </Button>
            <Button type="button" variant="link" size="xs" onClick={() => setProfile(barber)}>
              {t("booking.barber.profile")}
            </Button>
          </div>
        ))}
      </div>
      <BarberProfileDrawer
        barber={profile}
        serviceIds={serviceIds}
        onOpenChange={(open) => !open && setProfile(null)}
        onChoose={(barber) => {
          setProfile(null);
          actions.chooseBarber(barber.id);
        }}
      />
    </>
  );
}

/** Las horas: lo antes posible, los próximos días como pastillas y las horas libres de ese día. */
function TimesWidget() {
  const t = useAppT();
  const { state, shop, fmt, touch } = useBookingFlow();
  const { focus, actions } = useChatEngine();
  const draft = state.draft;
  const branch = shop.branches.find((item) => item.id === state.branchId);
  const first = React.useMemo(() => (branch ? firstBookableDay(branch.closesAt, shop.minNoticeMinutes) : startOfDay(new Date())), [branch, shop.minNoticeMinutes]);
  const [day, setDay] = React.useState<Date>(() => (focus.date ? parseStart(`${focus.date}T00:00`) : first));
  const [onlyWindow, setOnlyWindow] = React.useState(focus.window ?? null);
  const [expanded, setExpanded] = React.useState(false);
  const [waitlist, setWaitlist] = React.useState<WaitlistJoined | null>(null);
  const dayKey = dayKeyOf(day);
  const availability = useAvailabilityQuery({ branchId: state.branchId, date: dayKey, serviceIds: draft?.serviceIds ?? [], barberId: draft?.barberId ?? null });
  const earliest = useEarliestQuery({ branchId: state.branchId, serviceIds: draft?.serviceIds ?? [], barberId: draft?.barberId ?? null });
  const slots = availability.data?.date === dayKey ? availability.data.slots : [];
  const times = slots.map((slot) => slot.time).filter((time) => !onlyWindow || windowOf(time) === onlyWindow);
  const shown = expanded ? times : times.slice(0, VISIBLE_TIMES);
  const days = Array.from({ length: CHAT_DAYS }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  const soonest = earliest.data?.slot ?? null;
  const isWaiting = availability.isLoading || (availability.isFetching && availability.data?.date !== dayKey);
  if (!draft) return null;

  return (
    <Framed>
      {soonest && (
        <button
          type="button"
          onClick={() => actions.chooseTime(`${soonest.date}T${soonest.time}`)}
          className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-2.5 text-left transition-colors duration-fast ease-out-expo hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
        >
          <IconTile size="sm" shape="circle" icon={<ThemaIcon name="bolt" />} />
          <span className="flex min-w-0 flex-col">
            <Text as="span" size="xs" tone="secondary">
              {t("booking.earliest.title")}
            </Text>
            <Text as="span" size="sm" weight="semibold" tabular>
              {fmt.when(parseStart(`${soonest.date}T${soonest.time}`))}
            </Text>
          </span>
        </button>
      )}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("booking.agenda.dayLabel")}>
        {days.map((item) => (
          <Chip key={dayKeyOf(item)} label={isSameDayAs(item, new Date()) ? t("booking.earliest.today") : fmt.dayShort(item)} selected={isSameDayAs(item, day)} onClick={() => setDay(item)} size="sm" />
        ))}
      </div>
      {onlyWindow && (
        <Chip label={t(`booking.waitlist.${onlyWindow}`)} tone="primary" removable onRemove={() => setOnlyWindow(null)} size="sm" className="self-start" />
      )}
      {isWaiting ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      ) : times.length === 0 ? (
        <div className="flex flex-col gap-3">
          <Text size="sm" tone="secondary">
            {t("booking.chat.noTimes", { day: fmt.dayLong(day) })}
          </Text>
          <WaitlistCard day={day} joined={waitlist} onJoinedChange={setWaitlist} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {shown.map((time) => (
            <Button key={time} type="button" variant="outline" size={touch === "lg" ? "default" : "sm"} className="min-w-[4.5rem] rounded-full tabular-nums" onClick={() => actions.chooseTime(`${dayKey}T${time}`)}>
              {fmt.clock(time)}
            </Button>
          ))}
          {times.length > shown.length && (
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setExpanded(true)}>
              {t("booking.agenda.moreTimes", { count: times.length - shown.length })}
            </Button>
          )}
        </div>
      )}
    </Framed>
  );
}

function CartWidget() {
  const t = useAppT();
  const { state, totals, fmt } = useBookingFlow();
  const { actions } = useChatEngine();
  if (state.items.length === 0) {
    return (
      <Button type="button" className="self-start" onClick={() => actions.reply("book", t("booking.chat.reply.book"))}>
        <ThemaIcon name="plus" />
        {t("booking.chat.reply.book")}
      </Button>
    );
  }
  return (
    <Framed>
      <AgendaCartLines onEdit={actions.editItem} />
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Text size="sm" tone="secondary">
          {t("booking.payment.total")}
        </Text>
        <Text size="lg" weight="semibold" tabular>
          {fmt.money(totals.total)}
        </Text>
      </div>
    </Framed>
  );
}

function ProductsWidget() {
  const t = useAppT();
  const { catalog } = useBookingFlow();
  const { actions } = useChatEngine();
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        {(catalog?.products ?? []).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Button type="button" className="self-start" onClick={actions.productsDone}>
        <ThemaIcon name="check" />
        {t("booking.chat.ready")}
      </Button>
    </div>
  );
}

function NoteWidget() {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const { actions } = useChatEngine();
  return (
    <Framed>
      <Field label={t("booking.review.notes")}>
        <Textarea value={state.notes} onChange={(event) => dispatch({ type: "setNotes", notes: event.target.value })} placeholder={t("booking.review.notesPlaceholder")} rows={2} />
      </Field>
      <ReferencePhotoField />
      <Button type="button" className="self-end" onClick={actions.noteDone}>
        {t("booking.chat.saveNote")}
      </Button>
    </Framed>
  );
}

function PaymentWidget() {
  const t = useAppT();
  const payment = usePaymentController();
  return (
    <div className="flex flex-col gap-5">
      <PaymentPanel payment={payment} />
      <PayButton payment={payment} />
      <Text size="xs" tone="muted" className="text-center">
        {t("booking.payment.policyAccept")}
      </Text>
    </div>
  );
}

function ReceiptWidget() {
  const t = useAppT();
  const { state, shop, fmt } = useBookingFlow();
  const [receiptFor, setReceiptFor] = React.useState<Reservation | null>(null);
  const reservation = state.reservation;
  if (!reservation) return null;
  const owed = Math.max(0, reservation.totals.total - reservation.payment.paid);
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="outline" className="self-start">
        {t("booking.confirmed.number", { number: reservation.number })}
      </Badge>
      {reservation.appointments.map((item) => (
        <AppointmentCard
          key={item.id}
          data={{
            personName: item.personName,
            relation: item.guestRelation,
            services: item.serviceNames,
            barberName: item.barberName,
            barberAvatarUrl: item.barberAvatarUrl,
            day: fmt.day(parseStart(item.start)),
            time: fmt.time(parseStart(item.start)),
            duration: t("booking.review.minutes", { count: item.durationMin }),
            price: fmt.money(item.price),
            branchName: item.branchName,
          }}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => downloadIcs(buildIcs(reservation.appointments, shop.name), `${reservation.number}.ics`)}>
          <ThemaIcon name="calendarAdd" />
          {t("booking.confirmed.calendar")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setReceiptFor(reservation)}>
          <ThemaIcon name="mail" />
          {t("booking.confirmed.receipt")}
        </Button>
      </div>
      {reservation.payment.status !== "paid" && (
        <Text size="sm" tone="secondary">
          {t("booking.confirmed.payAtShop", { amount: fmt.money(owed) })}
        </Text>
      )}
      <RepeatOffer reservation={reservation} />
      <SendReceiptDialog reservation={receiptFor} onOpenChange={(open) => !open && setReceiptFor(null)} />
    </div>
  );
}

/** «Mis citas» en la conversación: lo que viene, con mover y cancelar (la política la dicen sus hojas). */
function ManageWidget() {
  const t = useAppT();
  const { shop, fmt, token } = useBookingFlow();
  const mine = useMyAppointmentsQuery(token);
  const [moving, setMoving] = React.useState<BookedAppointment | null>(null);
  const [cancelling, setCancelling] = React.useState<BookedAppointment | null>(null);
  if (!token) return null;
  if (mine.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  const upcoming = mine.data?.upcoming ?? [];
  return (
    <div className="flex flex-col gap-3">
      {upcoming.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("booking.chat.noUpcoming")}
        </Text>
      ) : (
        upcoming.map((item) => {
          const locked = !cancellationTerms({ start: parseStart(item.start), now: new Date(), cancelHours: shop.cancelHours, lateFeePercent: 0, price: 0, paid: 0 }).isFree;
          return (
            <AppointmentCard
              key={item.id}
              data={{
                personName: item.personName,
                relation: item.guestRelation,
                services: item.serviceNames,
                barberName: item.barberName,
                barberAvatarUrl: item.barberAvatarUrl,
                day: fmt.day(parseStart(item.start)),
                time: fmt.time(parseStart(item.start)),
                duration: t("booking.review.minutes", { count: item.durationMin }),
                price: fmt.money(item.price),
                branchName: item.branchName,
              }}
              actions={
                <>
                  <Button type="button" variant="ghost" size="sm" disabled={locked} onClick={() => setMoving(item)}>
                    <ThemaIcon name="clock" />
                    {t("booking.manage.reschedule")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCancelling(item)}>
                    <ThemaIcon name="close" />
                    {t("booking.manage.cancel")}
                  </Button>
                </>
              }
            />
          );
        })
      )}
      <RescheduleDrawer appointment={moving} token={token} onOpenChange={(open) => !open && setMoving(null)} />
      <CancelDialog appointment={cancelling} token={token} onOpenChange={(open) => !open && setCancelling(null)} />
    </div>
  );
}

const WIDGETS: Record<ChatWidget, () => React.ReactNode> = {
  phone: PhoneWidget,
  code: CodeWidget,
  profile: () => (
    <Framed>
      <ProfileForm />
    </Framed>
  ),
  blocked: BlockedWidget,
  call: CallWidget,
  home: HomeWidget,
  branches: BranchesWidget,
  services: ServicesWidget,
  barbers: BarbersWidget,
  times: TimesWidget,
  cart: CartWidget,
  products: ProductsWidget,
  note: NoteWidget,
  payment: PaymentWidget,
  receipt: ReceiptWidget,
  manage: ManageWidget,
};

/** La tarjeta de un mensaje: solo la del último mensaje se puede usar; las anteriores ya se respondieron. */
export function ChatWidgetView({ widget }: { widget: ChatWidget }) {
  const Widget = WIDGETS[widget];
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
      <Widget />
    </div>
  );
}

/** El título de la cabecera: el asistente de la barbería, con quién habla. */
export function ChatTitle() {
  const t = useAppT();
  const { shop } = useBookingFlow();
  return (
    <div className="flex min-w-0 flex-col">
      <Heading level={6} className="truncate">
        {t("booking.chat.title", { shop: shop.name })}
      </Heading>
      <Text size="xs" tone="muted" className="flex items-center gap-1.5">
        <span aria-hidden className="size-1.5 rounded-full bg-success" />
        {t("booking.chat.subtitle")}
      </Text>
    </div>
  );
}
