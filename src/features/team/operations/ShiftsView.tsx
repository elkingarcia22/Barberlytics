import * as React from "react";
import { ArrowLeftRight, Check, Hand, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoCard } from "../teamShared";
import { rangesOf } from "../shiftRanges";
import { isBarberRole, type TeamMember } from "../types";
import { useShiftActions, useShifts, type OpenShift, type ShiftRequest, type Shifts } from "./operationsApi";

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const REASON_KEYS: Readonly<Record<OpenShift["reason"], AppMessageKey>> = { vacation: "team.shifts.reason.vacation", sick: "team.shifts.reason.sick", personal: "team.shifts.reason.personal" };
const STATUS: Readonly<Record<ShiftRequest["status"], { key: AppMessageKey; badge: "pending" | "active" | "completed" | "inactive" }>> = {
  pending: { key: "team.shiftReq.status.pending", badge: "pending" },
  accepted: { key: "team.shiftReq.status.accepted", badge: "active" },
  approved: { key: "team.shiftReq.status.approved", badge: "completed" },
  rejected: { key: "team.shiftReq.status.rejected", badge: "inactive" },
  cancelled: { key: "team.shiftReq.status.cancelled", badge: "inactive" },
};

interface ShiftsViewProps {
  branchId: string;
  manages: boolean;
  /** La ficha de quien mira (barbero): pide, propone y responde. */
  memberId: string | null;
  members: readonly TeamMember[];
}

/**
 * Turnos abiertos e intercambio. Quien gestiona asigna un turno abierto o aprueba lo que piden; el barbero pide un turno
 * libre ese día, propone un cambio de día con un compañero y responde los que le proponen. Al aprobarse, los horarios de
 * ese día y sus citas pasan solos.
 */
export function ShiftsView(props: ShiftsViewProps) {
  const query = useShifts(props.branchId);
  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-72 w-full rounded-2xl" />}>
      {(data) => <ShiftsBody data={data} {...props} />}
    </QueryBoundary>
  );
}

function ShiftsBody({ data, manages, memberId, members }: ShiftsViewProps & { data: Shifts }) {
  const t = useAppT();
  const barbers = members.filter((member) => (isBarberRole(member.role) || member.isAlsoBarber) && member.status === "active");
  const pending = data.requests.filter((item) => item.status === "pending" || item.status === "accepted");
  const decided = data.requests.filter((item) => item.status !== "pending" && item.status !== "accepted").slice(0, 10);

  return (
    <div className="space-y-section" data-testid="shifts-view">
      <InfoCard title={t("team.shiftReq.openTitle")} description={t(manages ? "team.shiftReq.openHintManager" : "team.shiftReq.openHint")}>
        {data.open.length === 0 ? (
          <Text variant="muted">{t("team.shifts.empty")}</Text>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.open.map((shift) => (
              <OpenShiftRow key={shift.id} shift={shift} manages={manages} memberId={memberId} />
            ))}
          </ul>
        )}
      </InfoCard>

      {!manages && memberId && <SwapForm memberId={memberId} barbers={barbers} />}

      {pending.length > 0 && (
        <InfoCard title={t("team.shiftReq.pendingTitle")}>
          <ul className="divide-y divide-border/60">
            {pending.map((request) => (
              <RequestRow key={request.id} request={request} manages={manages} memberId={memberId} />
            ))}
          </ul>
        </InfoCard>
      )}

      {decided.length > 0 && (
        <InfoCard title={t("team.shiftReq.historyTitle")}>
          <ul className="divide-y divide-border/60">
            {decided.map((request) => (
              <RequestRow key={request.id} request={request} manages={manages} memberId={memberId} />
            ))}
          </ul>
        </InfoCard>
      )}

      {data.open.length === 0 && data.requests.length === 0 && manages && <EmptyState icon="calendar" title={t("team.shiftReq.emptyTitle")} description={t("team.shiftReq.emptyHint")} />}
    </div>
  );
}

function useFail() {
  return (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
}

const slotOf = (range: { start: string; end: string; breaks?: { start: string; end: string }[] }) => rangesOf(range).map((piece) => `${piece.start}–${piece.end}`).join(" · ");

function OpenShiftRow({ shift, manages, memberId }: { shift: OpenShift; manages: boolean; memberId: string | null }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { cover, assign, act } = useShiftActions();
  const fail = useFail();
  const [who, setWho] = React.useState<string>("");
  const mine = shift.requests.find((item) => item.requesterId === memberId);

  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0" data-testid={`open-shift-${shift.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {formatDate(new Date(`${shift.date}T12:00:00`), DAY)} · <span className="tabular-nums">{slotOf(shift.range)}</span>
          </p>
          <p className="text-xs text-text-muted">{t("team.shiftReq.of", { name: shift.memberName, reason: t(REASON_KEYS[shift.reason]).toLowerCase() })}</p>
        </div>
        {!manages && memberId && memberId !== shift.memberId && (
          <Button size="sm" variant={mine ? "ghost" : "outline"} disabled={Boolean(mine) || cover.isPending} onClick={() => cover.mutate(shift.id, { onSuccess: () => toast.success(t("team.shiftReq.requested")), onError: fail })} data-testid="shift-cover">
            <Hand /> {t(mine ? "team.shiftReq.requestedShort" : "team.shiftReq.take")}
          </Button>
        )}
      </div>
      {manages && (
        <div className="flex flex-wrap items-center gap-2">
          {shift.requests.map((request) => (
            <Button key={request.id} size="xs" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ id: request.id, action: "approve" }, { onSuccess: () => toast.success(t("team.shiftReq.approved")), onError: fail })}>
              <Check /> {t("team.shiftReq.approveFor", { name: request.requesterName })}
            </Button>
          ))}
          {shift.available.length === 0 ? (
            <Text size="xs" tone="muted">
              {t("team.shiftReq.nobodyFree")}
            </Text>
          ) : (
            <>
              <Select value={who} onValueChange={setWho}>
                <SelectTrigger size="sm" className="w-44" aria-label={t("team.shiftReq.assignTo")}>
                  <SelectValue placeholder={t("team.shiftReq.assignTo")} />
                </SelectTrigger>
                <SelectContent>
                  {shift.available.map((member) => (
                    <SelectItem key={member.memberId} value={member.memberId}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!who || assign.isPending} onClick={() => assign.mutate({ shiftId: shift.id, memberId: who }, { onSuccess: () => toast.success(t("team.shiftReq.assigned")), onError: fail })} data-testid="shift-assign">
                {t("team.shifts.assign")}
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function SwapForm({ memberId, barbers }: { memberId: string; barbers: readonly TeamMember[] }) {
  const t = useAppT();
  const { swap } = useShiftActions();
  const fail = useFail();
  const [date, setDate] = React.useState("");
  const [withMemberId, setWithMemberId] = React.useState("");
  const [withDate, setWithDate] = React.useState("");
  const ready = date && withMemberId && withDate;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    swap.mutate(
      { date, withMemberId, withDate },
      {
        onSuccess: () => {
          toast.success(t("team.shiftReq.swapSent"));
          setDate("");
          setWithDate("");
          setWithMemberId("");
        },
        onError: fail,
      }
    );
  };
  return (
    <InfoCard title={t("team.shiftReq.swapTitle")} description={t("team.shiftReq.swapHint")}>
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={submit} data-testid="shift-swap-form">
        <Field label={t("team.shiftReq.myDay")}>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label={t("team.shiftReq.with")}>
          <Select value={withMemberId} onValueChange={setWithMemberId}>
            <SelectTrigger aria-label={t("team.shiftReq.with")}>
              <SelectValue placeholder={t("team.shiftReq.pickColleague")} />
            </SelectTrigger>
            <SelectContent>
              {barbers
                .filter((member) => member.id !== memberId)
                .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {`${member.firstName} ${member.lastName}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("team.shiftReq.theirDay")}>
          <Input type="date" value={withDate} onChange={(event) => setWithDate(event.target.value)} />
        </Field>
        <Button type="submit" disabled={!ready || swap.isPending} data-testid="shift-swap-send">
          <ArrowLeftRight /> {t("team.shiftReq.propose")}
        </Button>
      </form>
    </InfoCard>
  );
}

function RequestRow({ request, manages, memberId }: { request: ShiftRequest; manages: boolean; memberId: string | null }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { act, cancel } = useShiftActions();
  const fail = useFail();
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const incoming = request.kind === "swap" && request.withMemberId === memberId && request.status === "pending";
  const mine = request.requesterId === memberId && (request.status === "pending" || request.status === "accepted");
  const approvable = manages && ((request.kind === "cover" && request.status === "pending") || (request.kind === "swap" && request.status === "accepted"));
  const run = (action: "accept" | "decline" | "approve" | "reject", done: AppMessageKey) => act.mutate({ id: request.id, action }, { onSuccess: () => toast.success(t(done)), onError: fail });
  const summary =
    request.kind === "cover"
      ? t("team.shiftReq.coverSummary", { name: request.requesterName, day: day(request.date) })
      : t("team.shiftReq.swapSummary", { name: request.requesterName, day: day(request.date), with: request.withName ?? "", withDay: day(request.withDate ?? request.date) });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" data-testid={`shift-request-${request.id}`}>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-text-primary">{summary}</p>
        {request.reason && <p className="text-xs text-text-muted">{request.reason}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={STATUS[request.status].badge} label={t(STATUS[request.status].key)} />
        {incoming && (
          <>
            <Button size="xs" onClick={() => run("accept", "team.shiftReq.accepted")} disabled={act.isPending} data-testid="shift-accept">
              <Check /> {t("team.shiftReq.accept")}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => run("decline", "team.shiftReq.declined")} disabled={act.isPending}>
              <X /> {t("team.shiftReq.decline")}
            </Button>
          </>
        )}
        {approvable && (
          <>
            <Button size="xs" onClick={() => run("approve", "team.shiftReq.approved")} disabled={act.isPending} data-testid="shift-approve">
              <Check /> {t("team.shiftReq.approve")}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => run("reject", "team.shiftReq.rejected")} disabled={act.isPending}>
              <X /> {t("team.shiftReq.reject")}
            </Button>
          </>
        )}
        {mine && !approvable && (
          <Button size="xs" variant="ghost" onClick={() => cancel.mutate(request.id, { onSuccess: () => toast.success(t("team.shiftReq.withdrawn")), onError: fail })} disabled={cancel.isPending}>
            {t("team.shiftReq.withdraw")}
          </Button>
        )}
      </div>
    </li>
  );
}
