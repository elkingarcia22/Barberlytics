import type { Service } from "@/features/calendar/types";
import { CompensationForm, CompensationView } from "./forms/CompensationForm";
import { OptionsForm, OptionsView } from "./forms/OptionsForm";
import { PaymentsForm, PaymentsView } from "./forms/PaymentsForm";
import { PermissionsForm } from "./forms/PermissionsForm";
import { ProfileForm, ProfileView } from "./forms/ProfileForm";
import { ScheduleForm, ScheduleView } from "./forms/ScheduleForm";
import { ServicesForm, ServicesView } from "./forms/ServicesForm";
import type { Level, MemberDraft, MemberTab, TeamMember } from "./types";

/**
 * Una pestaña de la ficha, en modo lectura o en modo edición. La ficha y el
 * alta montan la misma pieza: solo cambia si hay una persona que leer.
 */

export interface MemberTabFormProps {
  tab: MemberTab;
  draft: MemberDraft;
  onChange: (draft: MemberDraft) => void;
  levels: readonly Level[];
  services: readonly Service[];
  errors: Record<string, string>;
  formatMoney: (value: number) => string;
}

export function MemberTabForm({ tab, draft, onChange, levels, services, errors, formatMoney }: MemberTabFormProps) {
  const set = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) => onChange({ ...draft, [key]: value });
  if (tab === "profile") return <ProfileForm role={draft.role} value={draft.profile} onChange={(profile) => set("profile", profile)} levels={levels} errors={errors} />;
  if (tab === "services") return <ServicesForm services={services} value={draft.services} onChange={(value) => set("services", value)} formatMoney={formatMoney} />;
  if (tab === "compensation" && draft.compensation) return <CompensationForm value={draft.compensation} onChange={(value) => set("compensation", value)} errors={errors} formatMoney={formatMoney} />;
  if (tab === "payments" && draft.payments) return <PaymentsForm value={draft.payments} onChange={(value) => set("payments", value)} errors={errors} />;
  if (tab === "schedule") return <ScheduleForm value={draft.schedule} onChange={(value) => set("schedule", value)} error={errors.schedule} />;
  if (tab === "permissions") return <PermissionsForm role={draft.role} value={draft.permissions} onChange={(value) => set("permissions", value)} />;
  if (tab === "options") return <OptionsForm value={draft.options} onChange={(value) => set("options", value)} />;
  return null;
}

export interface MemberTabViewProps {
  tab: MemberTab;
  member: TeamMember;
  levels: readonly Level[];
  services: readonly Service[];
  formatMoney: (value: number) => string;
  /** Correo, teléfono y código; a un colega no se le enseñan (privacidad entre barberos). */
  showPrivate?: boolean;
}

export function MemberTabView({ tab, member, levels, services, formatMoney, showPrivate = true }: MemberTabViewProps) {
  if (tab === "profile") return <ProfileView member={member} levels={levels} showPrivate={showPrivate} />;
  if (tab === "services") return <ServicesView services={services} value={member.services} formatMoney={formatMoney} />;
  if (tab === "compensation" && member.compensation) return <CompensationView value={member.compensation} formatMoney={formatMoney} />;
  if (tab === "payments" && member.payments) return <PaymentsView value={member.payments} formatMoney={formatMoney} />;
  if (tab === "schedule") return <ScheduleView value={member.schedule} />;
  if (tab === "permissions") return <PermissionsForm role={member.role} value={member.permissions} />;
  if (tab === "options") return <OptionsView value={member.options} />;
  return null;
}
