import * as React from "react";
import { useNavigate } from "react-router";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot } from "@/components/app-shell";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { PageHeader } from "@/components/utility";
import { isBarberRole, useAccess } from "@/features/access";
import { AbsenceRequestDrawer } from "./AbsenceRequestDrawer";
import { useMembersQuery } from "./queries";
import { InfoCard } from "./teamShared";
import { useBranchId } from "./teamUtils";
import { ABSENCE_KIND_KEYS, ABSENCE_STATUS_KEYS, useAbsences, useCancelAbsence, useDecideAbsence, type Absence } from "./workforce";

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
const AFFECTED_SHOWN = 5;
const MIN_REASON = 3;
type StatusTab = Absence["status"];

/**
 * Las ausencias del equipo. Quien va por comisión o salario las pide y espera; el dueño o el
 * administrador las aprueban viendo antes qué citas hay en esos días (aprobar bloquea su agenda). El
 * barbero de renta las registra sin aprobación: decide su propia agenda.
 */
export function AbsencesPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const access = useAccess();
  const branchId = useBranchId();
  const query = useAbsences(branchId);
  const members = useMembersQuery(branchId);
  const manages = access.role === "owner" || access.role === "admin";
  const [requesting, setRequesting] = React.useState(false);
  const [tab, setTab] = React.useState<StatusTab>("pending");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("team.absence.title")]} />
      </ShellHeaderSlot>
      <PageHeader
        title={t("team.absence.title")}
        description={t(manages ? "team.absence.description" : "team.absence.descriptionOwn")}
        actions={
          <Button onClick={() => setRequesting(true)} data-testid="absence-new">
            <Plus /> {t(manages || access.role === "barbero-renta" ? "team.absence.create" : "team.absence.request")}
          </Button>
        }
      />
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />}>
        {(data) => {
          const counts = { pending: 0, approved: 0, rejected: 0 };
          for (const item of data.items) counts[item.status] += 1;
          const rows = data.items.filter((item) => item.status === tab);
          return (
            <>
              <ThemaTabs
                className="mb-section"
                variant="page"
                fitContent
                tabs={(["pending", "approved", "rejected"] as const).map((id) => ({ id, label: t(ABSENCE_STATUS_KEYS[id]), badge: counts[id] }))}
                activeTabId={tab}
                onTabChange={(next) => setTab(next as StatusTab)}
              />
              {rows.length === 0 ? (
                <EmptyState icon="calendar" title={t("team.absence.empty")} description={t(tab === "pending" ? "team.absence.emptyPending" : "team.absence.emptyHint")} />
              ) : (
                <div className="space-y-stack" data-testid="absence-list">
                  {rows.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} manages={manages} own={absence.memberId === access.member?.id} />
                  ))}
                </div>
              )}
            </>
          );
        }}
      </QueryBoundary>
      <AbsenceRequestDrawer
        open={requesting}
        onOpenChange={setRequesting}
        branchId={branchId}
        members={manages ? (members.data?.items ?? []).filter((member) => isBarberRole(member.role) || member.role === "recepcion") : []}
        approvesItself={manages || access.role === "barbero-renta"}
      />
    </div>
  );
}

function AbsenceCard({ absence, manages, own }: { absence: Absence; manages: boolean; own: boolean }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();
  const decide = useDecideAbsence();
  const cancel = useCancelAbsence();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const range = absence.startDate === absence.endDate ? formatDate(new Date(`${absence.startDate}T12:00:00`), DAY) : `${formatDate(new Date(`${absence.startDate}T12:00:00`), DAY)} – ${formatDate(new Date(`${absence.endDate}T12:00:00`), DAY)}`;
  const canCancel = manages || (own && absence.status === "pending");

  return (
    <InfoCard
      title={`${absence.memberName} · ${t(ABSENCE_KIND_KEYS[absence.kind])}`}
      description={range}
      actions={<StatusBadge status={absence.status === "approved" ? "active" : absence.status === "pending" ? "pending" : "inactive"} label={t(ABSENCE_STATUS_KEYS[absence.status])} />}
    >
      <div className="space-y-3" data-testid={`absence-${absence.id}`}>
        {absence.note && <Text variant="muted">{absence.note}</Text>}
        {absence.status === "rejected" && absence.reason && <Text variant="muted">{t("team.absence.rejectedBecause", { reason: absence.reason })}</Text>}
        {absence.affected.length > 0 ? (
          <div className="space-y-1">
            <Text variant="label">{t("team.absence.affected", { count: absence.affected.length })}</Text>
            <ul className="text-sm text-text-secondary">
              {absence.affected.slice(0, AFFECTED_SHOWN).map((item) => (
                <li key={item.id}>
                  <button type="button" className="hover:underline" onClick={() => navigate(`/calendario?fecha=${item.start.slice(0, 10)}&cita=${item.id}`)}>
                    {formatDate(new Date(item.start), WHEN)} · {item.client}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Text variant="muted">{t("team.absence.noAffected")}</Text>
        )}
        <Text variant="muted" className="text-xs">
          {t("team.absence.requestedBy", { name: absence.requestedBy, date: formatDate(new Date(absence.requestedAt), WHEN) })}
          {absence.decidedBy ? ` · ${t("team.absence.decidedBy", { name: absence.decidedBy })}` : ""}
        </Text>
        <div className="flex flex-wrap gap-2">
          {manages && absence.status === "pending" && (
            <>
              <Button size="sm" onClick={() => decide.mutate({ id: absence.id, decision: "approve" }, { onSuccess: () => toast.success(t("team.absence.approved")), onError: fail })} disabled={decide.isPending} data-testid="absence-approve">
                <Check /> {t("team.absence.approve")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejecting(true)} data-testid="absence-reject">
                <X /> {t("team.absence.reject")}
              </Button>
            </>
          )}
          {canCancel && absence.status !== "rejected" && (
            <Button size="sm" variant="ghost" onClick={() => cancel.mutate(absence.id, { onSuccess: () => toast.success(t("team.absence.cancelled")), onError: fail })} disabled={cancel.isPending}>
              <Trash2 /> {t("team.absence.cancel")}
            </Button>
          )}
        </div>
      </div>
      <ModalShell
        open={rejecting}
        onOpenChange={setRejecting}
        title={t("team.absence.rejectTitle", { name: absence.memberName })}
        size="md"
        actions={
          <>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < MIN_REASON || decide.isPending}
              onClick={() => decide.mutate({ id: absence.id, decision: "reject", reason: reason.trim() }, { onSuccess: () => (setRejecting(false), toast.success(t("team.absence.rejected"))), onError: fail })}
              data-testid="absence-reject-confirm"
            >
              {t("team.absence.reject")}
            </Button>
          </>
        }
      >
        <Field label={t("team.absence.reason")} required>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
        </Field>
      </ModalShell>
    </InfoCard>
  );
}

