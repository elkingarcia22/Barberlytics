import * as React from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs, Stepper } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useAccess } from "@/features/access";
import { useCatalogQuery } from "@/features/calendar/queries";
import { useMoney } from "@/features/calendar/calendarFormat";
import { MemberTabForm } from "./MemberTabEditor";
import { draftFromRole, serverFieldErrors, validateTab } from "./memberDraft";
import { useCreateMember, useLevelsQuery } from "./queries";
import { MEMBER_TAB_KEYS, TEAM_ROLE_KEYS, teamRoleSchema, memberName, memberTabs, type MemberDraft, type TeamRole } from "./types";
import { useBranchId } from "./teamUtils";
import { creatableRoles, seesBarberMoney } from "./teamAccess";

/**
 * Crear un miembro del equipo: el rol viene elegido en el panel anterior y
 * aquí se llena la ficha paso a paso. Cada paso se habilita al completar el
 * anterior; se puede volver atrás para corregir.
 */

export function MemberWizardPage() {
  const access = useAccess();
  const allowed = creatableRoles(access);
  // Sin «Equipo · Crear» no hay alta; con él, solo los roles que esa persona gestiona.
  if (allowed.length === 0) return <Navigate to="/403" replace />;
  return <MemberWizard allowed={allowed} withMoney={seesBarberMoney(access)} />;
}

function MemberWizard({ allowed, withMoney }: { allowed: readonly TeamRole[]; withMoney: boolean }) {
  const t = useAppT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("rol");
  const parsed = teamRoleSchema.safeParse(roleParam);
  const fallback: TeamRole = allowed.includes("barbero-comision") ? "barbero-comision" : allowed[0];
  const role: TeamRole = parsed.success && allowed.includes(parsed.data) ? parsed.data : fallback;
  const branchId = useBranchId();
  const levels = useLevelsQuery();
  const catalog = useCatalogQuery(branchId);
  const formatMoney = useMoney();
  const create = useCreateMember();
  const [draft, setDraft] = React.useState<MemberDraft>(() => draftFromRole(role, branchId));
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [leaving, setLeaving] = React.useState(false);
  // Sin «Sección de pagos de barberos» el dinero nace con los valores de fábrica y lo fija el dueño.
  const steps = memberTabs(role, draft.profile.isAlsoBarber).filter((item) => withMoney || (item !== "compensation" && item !== "payments"));
  const tab = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  const next = () => {
    const clientErrors = validateTab(tab, draft);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    if (!isLast) {
      setStep((current) => current + 1);
      return;
    }
    create.mutate(draft, {
      onSuccess: (member) => {
        toast.success(t("teamCreate.created"), { description: t("teamCreate.createdHint", { name: memberName(member), role: t(TEAM_ROLE_KEYS[member.role]) }) });
        navigate(`/usuarios/miembros/${member.id}`);
      },
      onError: (error) => {
        const fields = serverFieldErrors(error);
        setErrors(fields);
        if (Object.keys(fields).length > 0) setStep(0);
        toast.error(describeError(error).title, { description: describeError(error).description });
      },
    });
  };

  return (
    <div className="space-y-6">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("team.title"), onClick: () => navigate("/usuarios") }, t("teamCreate.title")]} />
      </ShellHeaderSlot>

      <PageHeader
        title={t("teamCreate.pageTitle", { role: t(TEAM_ROLE_KEYS[role]) })}
        description={t("teamCreate.pageHint")}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setLeaving(true)}>
            <X /> {t("teamCreate.cancel")}
          </Button>
        }
      />

      <Stepper steps={steps.map((item) => ({ id: item, label: t(MEMBER_TAB_KEYS[item]) }))} current={step} onStepClick={(index) => index < step && setStep(index)} />

      <div data-testid="wizard-step">
        <MemberTabForm tab={tab} draft={draft} onChange={setDraft} levels={levels.data?.items ?? []} services={catalog.data?.services ?? []} errors={errors} formatMoney={formatMoney} />
      </div>

      <div className="sticky bottom-4 z-sticky flex items-center justify-between gap-2 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur">
        <Text variant="muted">{t("teamCreate.stepOf", { current: step + 1, total: steps.length })}</Text>
        <div className="flex gap-2">
          <Button variant="outline" disabled={step === 0 || create.isPending} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            <ArrowLeft /> {t("teamCreate.back")}
          </Button>
          <Button onClick={next} disabled={create.isPending} data-testid="wizard-next">
            {isLast ? <Check /> : <ArrowRight />} {isLast ? t("teamCreate.create") : t("teamCreate.continue")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        variant="warning"
        title={t("teamCreate.cancelTitle")}
        description={t("teamCreate.cancelHint")}
        confirmLabel={t("teamCreate.cancelConfirm")}
        onConfirm={() => navigate("/usuarios")}
      />
    </div>
  );
}
