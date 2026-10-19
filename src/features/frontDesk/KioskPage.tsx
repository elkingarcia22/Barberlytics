import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck2, Footprints, Languages, PartyPopper, Type, UsersRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/forms";
import type { CountryCode } from "@/components/forms/phoneCountries";
import { cn } from "@/lib/utils";
import { KioskError, kioskApi, kioskToken, type KioskAppointment, type KioskCheckIn, type KioskInfo, type KioskJoined } from "./kioskApi";

/**
 * El kiosco de la sede (`/kiosco`): la tablet de recepción donde el cliente marca que llegó o se une a la
 * fila si viene sin cita. Pensado para el dedo y para una pantalla que ve cualquiera: solo nombre de pila
 * y hora, nada de correo, teléfono ni barbero de otro, y vuelve sola al inicio. Idioma y letra grande a
 * un toque. Sin token, pide el código de 6 dígitos de Configuración › Agendamiento online.
 */

type Screen =
  | { kind: "home" }
  | { kind: "phone" }
  | { kind: "pick"; phone: string; items: KioskAppointment[] }
  | { kind: "arrived"; result: KioskCheckIn }
  | { kind: "service" }
  | { kind: "barber"; serviceId: string }
  | { kind: "name"; serviceId: string; barberId: string | null }
  | { kind: "joined"; result: KioskJoined };

/** Lo que tarda en volver solo al inicio: tras terminar, y si nadie toca la pantalla a mitad. */
const DONE_RESET_MS = 15_000;
const IDLE_RESET_MS = 60_000;
const INFO_REFRESH_MS = 30_000;
const BIG = "h-16 w-full justify-start gap-3 rounded-2xl px-5 text-lg";

function useAutoReset(screen: Screen, reset: () => void) {
  React.useEffect(() => {
    if (screen.kind === "home") return;
    const done = screen.kind === "arrived" || screen.kind === "joined";
    let timer = window.setTimeout(reset, done ? DONE_RESET_MS : IDLE_RESET_MS);
    const touch = () => {
      if (done) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, IDLE_RESET_MS);
    };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
    };
  }, [screen, reset]);
}

function WaitText({ min, max }: { min: number | null; max: number | null }) {
  const t = useAppT();
  if (min === null || max === null) return <>{t("kiosk.noTimeToday")}</>;
  if (max <= 10) return <>{t("kiosk.almostNow")}</>;
  return <>{t("kiosk.wait", { min, max })}</>;
}

export function Pairing({ onPaired }: { onPaired: () => void }) {
  const t = useAppT();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await kioskApi.pair(code);
      onPaired();
    } catch (caught) {
      setError(caught instanceof KioskError ? caught.message : t("kiosk.genericError"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4" data-testid="kiosk-pair">
      <Heading level={2}>{t("kiosk.pairTitle")}</Heading>
      <Text tone="muted">{t("kiosk.pairHint")}</Text>
      <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="h-16 text-center font-mono text-3xl tracking-[0.4em]" aria-label={t("kiosk.pairCode")} data-testid="kiosk-pair-code" />
      {error && (
        <Text tone="negative" role="alert">
          {error}
        </Text>
      )}
      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={code.length !== 6 || busy}>
        {t("kiosk.pairSubmit")}
      </Button>
    </form>
  );
}

/** «14:50» → «2:50 p. m.» en el idioma del kiosco. */
function useClock() {
  const { formatDate } = useLocale();
  return (time: string) => {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    return formatDate(new Date(2000, 0, 1, hours, minutes), { hour: "numeric", minute: "2-digit" });
  };
}

/** El celular a tamaño de dedo: el prefijo y el número, altos y con letra grande. */
const BIG_PHONE = "[&_button]:h-14 [&_input]:h-14 [&_input]:text-xl";

function KioskFlow({ info }: { info: KioskInfo }) {
  const t = useAppT();
  const clock = useClock();
  const queryClient = useQueryClient();
  const [screen, setScreen] = React.useState<Screen>({ kind: "home" });
  const [phone, setPhone] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const reset = React.useCallback(() => {
    setScreen({ kind: "home" });
    setPhone("");
    setFirstName("");
    setError(null);
    void queryClient.invalidateQueries({ queryKey: ["kiosk", "me"] });
  }, [queryClient]);
  useAutoReset(screen, reset);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(caught instanceof KioskError ? caught.message : t("kiosk.genericError"));
    } finally {
      setBusy(false);
    }
  };
  const back = (to: Screen) => (
    <Button type="button" variant="ghost" size="lg" className="-ml-3 text-base" onClick={() => setScreen(to)}>
      <ArrowLeft aria-hidden />
      {t("kiosk.back")}
    </Button>
  );
  const country = info.phoneCountry as CountryCode | null;

  if (screen.kind === "home")
    return (
      <div className="space-y-4" data-testid="kiosk-home">
        <Heading level={1}>{t("kiosk.welcome")}</Heading>
        <Button size="lg" className={BIG} onClick={() => setScreen({ kind: "phone" })} data-testid="kiosk-have-appointment">
          <CalendarCheck2 aria-hidden className="size-6" />
          {t("kiosk.haveAppointment")}
        </Button>
        <Button size="lg" variant="outline" className={cn(BIG, "h-auto min-h-16 flex-col items-start gap-0.5 py-3")} onClick={() => setScreen({ kind: "service" })} data-testid="kiosk-walk-in">
          <span className="flex items-center gap-3">
            <Footprints aria-hidden className="size-6" />
            {t("kiosk.noAppointment")}
          </span>
          <span className="pl-9 text-sm font-normal text-text-muted">
            {info.queue.waiting > 0 ? t("kiosk.queueNow", { count: info.queue.waiting }) : t("kiosk.queueEmpty")} · <WaitText min={info.queue.waitMin} max={info.queue.waitMax} />
          </span>
        </Button>
      </div>
    );

  if (screen.kind === "phone")
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => setScreen({ kind: "pick", phone, items: (await kioskApi.lookup(phone)).appointments }));
        }}
      >
        {back({ kind: "home" })}
        <Heading level={2}>{t("kiosk.phoneTitle")}</Heading>
        <Text tone="muted">{t("kiosk.phoneHint")}</Text>
        <PhoneInput value={phone} onValueChange={setPhone} defaultCountry={country ?? undefined} className={BIG_PHONE} aria-label={t("kiosk.phoneTitle")} data-testid="kiosk-phone" />
        {error && <Text tone="negative">{error}</Text>}
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={phone.replace(/\D/g, "").length < 8 || busy} data-testid="kiosk-lookup">
          {t("kiosk.find")}
        </Button>
      </form>
    );

  if (screen.kind === "pick")
    return (
      <div className="space-y-4">
        {back({ kind: "phone" })}
        {screen.items.length === 0 ? (
          <>
            <Heading level={2}>{t("kiosk.notFoundTitle")}</Heading>
            <Text tone="muted">{t("kiosk.notFoundHint")}</Text>
            <Button size="lg" className={BIG} onClick={() => setScreen({ kind: "service" })}>
              <UsersRound aria-hidden className="size-6" />
              {t("kiosk.joinInstead")}
            </Button>
          </>
        ) : (
          <>
            <Heading level={2}>{t("kiosk.hello", { name: screen.items[0].firstName })}</Heading>
            <Text tone="muted">{t("kiosk.pickHint")}</Text>
            {screen.items.map((item) => (
              <Button key={item.id} size="lg" className={BIG} disabled={busy} onClick={() => void run(async () => setScreen({ kind: "arrived", result: await kioskApi.checkIn(item.id, screen.phone) }))} data-testid="kiosk-check-in">
                <CalendarCheck2 aria-hidden className="size-6" />
                {t("kiosk.arrivedFor", { time: clock(item.time) })}
              </Button>
            ))}
          </>
        )}
        {error && <Text tone="negative">{error}</Text>}
      </div>
    );

  if (screen.kind === "arrived")
    return (
      <div className="space-y-3 text-center" data-testid="kiosk-arrived" role="status">
        <PartyPopper aria-hidden className="mx-auto size-12 text-primary" />
        <Heading level={1}>{t("kiosk.arrivedTitle", { name: screen.result.firstName })}</Heading>
        <Text size="lg">{screen.result.barberFirstName ? t("kiosk.arrivedBarber", { barber: screen.result.barberFirstName }) : t("kiosk.arrivedTeam")}</Text>
        <Button variant="ghost" size="lg" onClick={reset}>
          {t("kiosk.done")}
        </Button>
      </div>
    );

  if (screen.kind === "service")
    return (
      <div className="space-y-3">
        {back({ kind: "home" })}
        <Heading level={2}>{t("kiosk.serviceTitle")}</Heading>
        <div className="grid gap-2 sm:grid-cols-2">
          {info.services.map((service) => (
            <Button key={service.id} size="lg" variant="outline" className={cn(BIG, "h-auto min-h-16 flex-col items-start gap-0.5 py-3")} onClick={() => setScreen({ kind: "barber", serviceId: service.id })} data-testid="kiosk-service">
              <span>{service.name}</span>
              <span className="text-sm font-normal text-text-muted">{t("kiosk.minutes", { minutes: service.durationMin })}</span>
            </Button>
          ))}
        </div>
      </div>
    );

  if (screen.kind === "barber")
    return (
      <div className="space-y-3">
        {back({ kind: "service" })}
        <Heading level={2}>{t("kiosk.barberTitle")}</Heading>
        <Button size="lg" className={BIG} onClick={() => setScreen({ kind: "name", serviceId: screen.serviceId, barberId: null })} data-testid="kiosk-any-barber">
          <UsersRound aria-hidden className="size-6" />
          {t("kiosk.anyBarber")}
        </Button>
        <div className="grid gap-2 sm:grid-cols-2">
          {info.barbers.map((barber) => (
            <Button key={barber.id} size="lg" variant="outline" className={BIG} onClick={() => setScreen({ kind: "name", serviceId: screen.serviceId, barberId: barber.id })}>
              {barber.avatarUrl && <img src={barber.avatarUrl} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />}
              {barber.firstName}
            </Button>
          ))}
        </div>
      </div>
    );

  if (screen.kind === "name")
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => setScreen({ kind: "joined", result: await kioskApi.join({ firstName: firstName.trim(), phone: phone || undefined, serviceIds: [screen.serviceId], barberId: screen.barberId }) }));
        }}
      >
        {back({ kind: "barber", serviceId: screen.serviceId })}
        <Heading level={2}>{t("kiosk.nameTitle")}</Heading>
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={40} autoComplete="off" className="h-14 text-xl" aria-label={t("kiosk.nameTitle")} data-testid="kiosk-name" />
        <Text tone="muted">{t("kiosk.phoneOptional")}</Text>
        <PhoneInput value={phone} onValueChange={setPhone} defaultCountry={country ?? undefined} className={BIG_PHONE} aria-label={t("kiosk.phoneOptional")} />
        {error && <Text tone="negative">{error}</Text>}
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={firstName.trim().length < 2 || busy} data-testid="kiosk-join">
          {t("kiosk.join")}
        </Button>
      </form>
    );

  return (
    <div className="space-y-3 text-center" data-testid="kiosk-joined" role="status">
      <Text size="lg" tone="muted">
        {t("kiosk.joinedTitle", { name: screen.result.firstName })}
      </Text>
      <Heading level={1} as="p" className="text-6xl tabular-nums" data-testid="kiosk-position">
        #{screen.result.position}
      </Heading>
      <Text size="lg">
        <WaitText min={screen.result.waitMin} max={screen.result.waitMax} />
        {screen.result.barberFirstName && ` · ${t("kiosk.with", { barber: screen.result.barberFirstName })}`}
      </Text>
      <Text tone="muted">{t("kiosk.joinedHint")}</Text>
      <Button variant="ghost" size="lg" onClick={reset}>
        {t("kiosk.done")}
      </Button>
    </div>
  );
}

export function KioskPage() {
  const t = useAppT();
  const { locale, setLocale } = useLocale();
  const queryClient = useQueryClient();
  const [paired, setPaired] = React.useState(() => kioskToken.get() !== null);
  const [large, setLarge] = React.useState(false);
  const info = useQuery({
    queryKey: ["kiosk", "me"],
    queryFn: () => kioskApi.me(),
    enabled: paired,
    refetchInterval: INFO_REFRESH_MS,
    retry: (count, error) => !(error instanceof KioskError && error.status === 401) && count < 2,
  });
  // Lo desactivaron desde Configuración: vuelve a pedir el código.
  const revoked = info.error instanceof KioskError && info.error.status === 401;
  const onPaired = () => {
    setPaired(true);
    void queryClient.resetQueries({ queryKey: ["kiosk", "me"] });
  };

  return (
    <main className="flex min-h-dvh flex-col bg-background text-text-primary" style={large ? { zoom: 1.2 } : undefined} data-testid="kiosk">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <Text as="p" weight="medium" truncate>
            {info.data?.shopName || t("kiosk.title")}
          </Text>
          {info.data && (
            <Text as="p" size="sm" tone="muted" truncate>
              {info.data.branch.name}
            </Text>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "es" : "en")} aria-label={t("kiosk.language")}>
          <Languages aria-hidden />
          {locale === "en" ? "Español" : "English"}
        </Button>
        <Button variant={large ? "secondary" : "ghost"} size="sm" aria-pressed={large} onClick={() => setLarge((value) => !value)}>
          <Type aria-hidden />
          {t("kiosk.largeText")}
        </Button>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        {!paired || revoked ? <Pairing onPaired={onPaired} /> : info.data ? <KioskFlow info={info.data} /> : <Text tone="muted">{t("kiosk.loading")}</Text>}
      </div>
    </main>
  );
}
