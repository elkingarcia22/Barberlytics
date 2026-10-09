import * as React from "react";
import { CalendarClock, CalendarSearch, FlaskConical, ListChecks, MessagesSquare, Monitor, PanelBottomOpen, Smartphone, Tablet } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Grain } from "@/components/atmosphere";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { ThemeModeToggle } from "@/themes/ThemeSelector";
import { BookingFlow } from "./BookingFlow";
import { DemoHints } from "./preview/DemoHints";
import { DemoSite } from "./preview/DemoSite";
import { DeviceFrame } from "./preview/DeviceFrame";
import { isBookingVersion, type BookingVersion } from "./versions";

type PreviewMode = "phone" | "tablet" | "monitor" | "widget";
const MODES: readonly PreviewMode[] = ["phone", "tablet", "monitor", "widget"];
const PUBLIC_PATH = "/reservar";
/** Por debajo de esto no caben los marcos: la reserva va a pantalla completa. */
const FRAME_MIN_WIDTH = 768;

function useIsNarrow(): boolean {
  const query = `(max-width: ${FRAME_MIN_WIDTH - 1}px)`;
  const [isNarrow, setIsNarrow] = React.useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setIsNarrow(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return isNarrow;
}

/**
 * «Agendamiento online»: la reserva que ve el cliente de la barbería.
 *
 * Con `?embed=1` es la página pública, a pantalla completa (la que se abre en
 * la tablet del local o desde el enlace). Sin él, quien administra la ve
 * dentro de cada pantalla donde vive —celular, tablet, monitor o el widget de
 * su sitio— y la puede recorrer entera con los datos de la demo.
 */
export function BookingPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const isNarrow = useIsNarrow();
  const isEmbed = params.get("embed") === "1";
  const requested = params.get("vista") as PreviewMode | null;
  const mode: PreviewMode = requested && MODES.includes(requested) ? requested : "tablet";
  const requestedVersion = params.get("version");
  const version: BookingVersion = isBookingVersion(requestedVersion) ? requestedVersion : "guided";
  // El enlace público lleva la versión elegida (la guiada es la de siempre y no la necesita).
  const publicUrl = `${window.location.origin}${PUBLIC_PATH}?embed=1${version === "guided" ? "" : `&version=${version}`}`;

  if (isEmbed) {
    return (
      <main className="h-dvh">
        {/* La página pública cuenta para el embudo; `widget=1` la marca como abierta desde el sitio. */}
        <BookingFlow version={version} layout={isNarrow ? "compact" : "wide"} touch={isNarrow ? "default" : "lg"} surface={params.get("widget") === "1" ? "widget" : "link"} />
      </main>
    );
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t("booking.preview.copied"));
    } catch {
      toast(publicUrl);
    }
  };

  const versions = [
    { value: "guided", label: t("booking.version.guided"), icon: ListChecks },
    { value: "welcome-lab", label: t("booking.version.welcomeLab"), icon: FlaskConical },
    { value: "agenda", label: t("booking.version.agenda"), icon: CalendarClock },
    { value: "agenda-select", label: t("booking.version.agendaSelect"), icon: CalendarSearch },
    { value: "chat", label: t("booking.version.chat"), icon: MessagesSquare },
  ];
  const versionHint = { guided: t("booking.version.guidedHint"), "welcome-lab": t("booking.version.welcomeLabHint"), agenda: t("booking.version.agendaHint"), "agenda-select": t("booking.version.agendaSelectHint"), chat: t("booking.version.chatHint") }[version];
  const setParam = (key: string, value: string) => setParams((current) => ({ ...Object.fromEntries(current), [key]: value }), { replace: true });

  const modes = [
    { value: "phone", label: t("booking.preview.phone"), icon: Smartphone },
    { value: "tablet", label: t("booking.preview.tablet"), icon: Tablet },
    { value: "monitor", label: t("booking.preview.monitor"), icon: Monitor },
    { value: "widget", label: t("booking.preview.widget"), icon: PanelBottomOpen },
  ];

  return (
    <div className="flex h-dvh flex-col bg-surface-subtle">
      <header className="relative z-header flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ThemaIcon name="arrowLeft" />
          <span className="hidden sm:inline">{t("booking.preview.back")}</span>
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <Text weight="semibold" truncate>
            {t("booking.preview.title")}
          </Text>
          <Badge variant="secondary">{t("booking.preview.badge")}</Badge>
        </div>
        {!isNarrow && (
          <div className="order-last flex w-full justify-center lg:order-none lg:w-auto lg:flex-1">
            <SegmentedControl
              options={modes}
              value={mode}
              onChange={(value) => setParam("vista", value)}
              size="sm"
              ariaLabel={t("booking.preview.mode")}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <DemoHints />
          <ThemeModeToggle />
          <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
            <ThemaIcon name="link" />
            <span className="hidden md:inline">{t("booking.preview.copy")}</span>
          </Button>
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("booking.preview.open")}>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ThemaIcon name="expand" />
            </a>
          </Button>
        </div>
      </header>

      {/* Las tres maneras de reservar: no son pieles, cada una parte de una pregunta distinta. */}
      <div className="relative z-raised flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface/80 px-4 py-2 backdrop-blur">
        <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
          {t("booking.version.label")}
        </Text>
        <SegmentedControl options={versions} value={version} onChange={(value) => setParam("version", value)} size="sm" fullWidth={isNarrow} ariaLabel={t("booking.version.label")} />
        <Text size="sm" tone="secondary" className="min-w-0 flex-1 basis-60">
          {versionHint}
        </Text>
      </div>

      <main className="relative isolate flex min-h-0 flex-1 items-center justify-center overflow-hidden p-0 md:p-6">
        <Grain scope="container" />
        {isNarrow ? (
          <div className="h-full w-full">
            <BookingFlow key={version} version={version} layout="compact" />
          </div>
        ) : mode === "widget" ? (
          <DeviceFrame device="monitor" address="barberia.example.com">
            <DemoSite version={version} />
          </DeviceFrame>
        ) : (
          <DeviceFrame key={mode} device={mode} address={publicUrl.replace(/^https?:\/\//, "")}>
            <BookingFlow key={version} version={version} layout={mode === "monitor" ? "wide" : "compact"} touch={mode === "tablet" ? "lg" : "default"} />
          </DeviceFrame>
        )}
      </main>
    </div>
  );
}
