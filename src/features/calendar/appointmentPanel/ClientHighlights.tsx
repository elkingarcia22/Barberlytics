import { CalendarCheck, History, Scissors, StickyNote, UserRound, type LucideIcon } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { IconTile } from "@/components/utility/IconTile";
import type { ModelContext } from "../calendarModel";
import { clientHighlights, type ClientHighlight, type ClientTab } from "./clientHighlightsModel";
import { useClientVisits } from "./clientVisits";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * «Lo importante» de «Sobre {nombre}»: una fila por punto, del aviso al dato, y cada una abre la
 * pestaña de su página donde está el detalle (tocar «6 visitas» lleva a sus visitas).
 */

const ICONS: Readonly<Record<ClientHighlight["kind"], LucideIcon>> = {
  reliability: CalendarCheck,
  rhythm: History,
  lastVisit: Scissors,
  note: StickyNote,
  loyalty: UserRound,
};

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

export function ClientHighlights({ model, ctx, onOpen }: { model: AppointmentModel; ctx: ModelContext; onOpen: (tab: ClientTab) => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const known = model.known;
  const visits = useClientVisits(known?.id);
  if (!known) return null;
  const preferred = known.preferredBarberId ? ctx.catalog.barbers.find((barber) => barber.id === known.preferredBarberId) : undefined;
  const items = clientHighlights({
    notes: model.notes,
    visits: known.visits,
    noShows: known.noShows,
    cancellations: known.cancellations,
    lastVisit: model.lastVisit,
    visitEveryDays: known.visitEveryDays,
    preferredName: preferred?.name ?? null,
    barberId: model.barber?.id ?? null,
    barberName: model.barber?.name.split(" ")[0] ?? null,
    history: visits.appointments,
    now: ctx.now ?? new Date(),
  });

  const text = (item: ClientHighlight): { title: string; description?: string } => {
    switch (item.kind) {
      case "reliability":
        return { title: t("calendar.panel.highlight.visits", { count: item.visits }), description: t("calendar.panel.highlight.reliability", { noShows: item.noShows, cancellations: item.cancellations }) };
      case "rhythm":
        return item.overdue
          ? { title: t("calendar.panel.highlight.overdue", { days: item.daysSince }), description: t("calendar.panel.highlight.usually", { days: item.every ?? 0 }) }
          : { title: t("calendar.panel.highlight.lastDays", { days: item.daysSince }), description: item.every ? t("calendar.client.every", { days: item.every }) : t("calendar.client.noRhythm") };
      case "lastVisit": {
        const date = formatDate(new Date(item.visit.start), SHORT_DATE);
        return { title: t("calendar.panel.highlight.lastTime", { service: item.visit.service }), description: item.visit.barber ? t("calendar.panel.highlight.lastTimeWith", { barber: item.visit.barber, date }) : date };
      }
      case "note":
        return { title: t("calendar.panel.client.latestNote"), description: item.more > 0 ? `${item.note.text} · ${t("calendar.panel.highlight.moreNotes", { count: item.more })}` : item.note.text };
      case "loyalty":
        return {
          title: item.preferredName ? t("calendar.panel.highlight.usualBarber", { name: item.preferredName }) : t("calendar.panel.highlight.noUsualBarber"),
          description: item.barberName && item.total > 0 ? t("calendar.panel.highlight.withBarber", { count: item.withBarber, total: item.total, name: item.barberName }) : undefined,
        };
    }
  };

  return (
    <ListItemGroup aria-label={t("calendar.panel.highlight.title")} data-testid="panel-client-highlights">
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        const { title, description } = text(item);
        return (
          <ListItem
            key={item.kind}
            size="sm"
            leading={<IconTile size="sm" shape="circle" tone={item.tone} icon={<Icon />} />}
            title={title}
            description={description}
            onClick={() => onOpen(item.tab)}
            data-testid={`panel-client-highlight-${item.kind}`}
          />
        );
      })}
    </ListItemGroup>
  );
}
