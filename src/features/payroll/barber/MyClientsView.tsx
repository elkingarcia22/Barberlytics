import * as React from "react";
import { useNavigate } from "react-router";
import { MessageCircle } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { CustomerBulkWhatsAppDialog } from "@/features/customers/CustomerBulkWhatsAppDialog";
import { SEGMENT_KEYS, type Customer } from "@/features/customers/types";
import { useDueClients, type DueClients } from "../barberPay";

const SLOT_DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/**
 * Mis clientes por volver: los suyos a los que ya les pasó su ritmo de visita, en riesgo o perdidos (la regla de los
 * avisos de Clientes), del más atrasado al menos. Cada mensaje sale con su nombre y su primer hueco libre, uno por uno o a todos.
 */
export function MyClientsView({ branchId, memberId, barberName }: { branchId: string; memberId: string; barberName: string }) {
  const t = useAppT();
  const query = useDueClients(branchId, memberId);
  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full rounded-2xl" />}>
      {(data) => (data.items.length === 0 ? <EmptyState icon="users" title={t("payroll.clients.emptyTitle")} description={t("payroll.clients.emptyHint")} /> : <DueList data={data} barberName={barberName} />)}
    </QueryBoundary>
  );
}

function DueList({ data, barberName }: { data: DueClients; barberName: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();
  const [writing, setWriting] = React.useState<readonly Customer[] | null>(null);
  const slotText = data.nextSlot ? t("payroll.clients.slot", { day: formatDate(new Date(`${data.nextSlot.day}T12:00:00`), SLOT_DAY), time: data.nextSlot.time }) : null;

  return (
    <div className="space-y-stack" data-testid="my-due-clients">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text weight="semibold">{t("payroll.clients.title", { count: data.items.length })}</Text>
          <Text size="sm" tone="muted">
            {slotText ? t("payroll.clients.nextSlot", { slot: slotText }) : t("payroll.clients.noSlot")}
          </Text>
        </div>
        <Button onClick={() => setWriting(data.items)} data-testid="my-due-write-all">
          <MessageCircle /> {t("payroll.clients.writeAll", { count: data.items.length })}
        </Button>
      </div>
      <ListItemGroup>
        {data.items.map((client) => (
          <ListItem
            key={client.id}
            title={client.name}
            description={[t(SEGMENT_KEYS[client.segment]), client.daysSince !== null ? t("payroll.clients.since", { days: client.daysSince }) : null, client.visitEveryDays ? t("payroll.clients.rhythm", { days: client.visitEveryDays }) : null].filter(Boolean).join(" · ")}
            onClick={() => navigate(`/clientes/${client.id}`)}
            actions={
              <Button size="sm" variant="outline" onClick={() => setWriting([client])} aria-label={t("payroll.clients.writeOne", { name: client.name })}>
                <MessageCircle /> {t("payroll.clients.write")}
              </Button>
            }
          />
        ))}
      </ListItemGroup>
      {writing && <CustomerBulkWhatsAppDialog open onOpenChange={(open) => !open && setWriting(null)} customers={writing} purpose="rebook" barberName={barberName} slotText={slotText} />}
    </div>
  );
}
