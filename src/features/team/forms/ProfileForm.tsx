import * as React from "react";
import { Camera, Eye, EyeOff, KeyRound, Mail, Phone, Plus, Trash2, X } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "@/components/utility";
import { ImageCropDialog, UploadZone } from "@/components/upload";
import { Text } from "@/components/typography";
import { InfoCard, InfoRow, MemberAvatar } from "../teamShared";
import { isBarberRole, memberName, type Level, type ProfileInput, type TeamMember, type TeamRole } from "../types";
import { branchName } from "../teamUtils";

/**
 * La pestaña Perfil: la foto, los datos de contacto, la descripción, si se
 * puede agendar, el nivel, las habilidades y la galería. Un gerente ve un
 * formulario más corto, con el interruptor «esta persona es barbero».
 */

export interface ProfileFormProps {
  role: TeamRole;
  value: ProfileInput;
  onChange: (value: ProfileInput) => void;
  levels: readonly Level[];
  errors?: Record<string, string>;
}

const MAX_GALLERY = 5;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function ProfileForm({ role, value, onChange, levels, errors = {} }: ProfileFormProps) {
  const t = useAppT();
  const isBarber = isBarberRole(role);
  const [cropSource, setCropSource] = React.useState<string | null>(null);
  const [skillDraft, setSkillDraft] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProfileInput>(key: K, next: ProfileInput[K]) => onChange({ ...value, [key]: next });

  const pickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCropSource(await readAsDataUrl(file));
  };

  const addSkill = () => {
    const skill = skillDraft.trim();
    if (!skill || value.skills.includes(skill)) return;
    set("skills", [...value.skills, skill]);
    setSkillDraft("");
  };

  const addGallery = async (files: File[]) => {
    const urls = await Promise.all(files.slice(0, MAX_GALLERY - value.gallery.length).map(readAsDataUrl));
    set("gallery", [...value.gallery, ...urls].slice(0, MAX_GALLERY));
  };

  return (
    <div className="space-y-6" data-testid="profile-form">
      <div className="flex items-center gap-4">
        <MemberAvatar member={{ firstName: value.firstName || "?", lastName: value.lastName, avatarUrl: value.avatarUrl }} size="lg" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera /> {t("teamMember.profile.changePhoto")}
          </Button>
          {value.avatarUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => set("avatarUrl", null)}>
              <Trash2 /> {t("teamMember.profile.removePhoto")}
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={pickPhoto} aria-label={t("teamMember.profile.photo")} />
        </div>
      </div>
      {cropSource && (
        <ImageCropDialog
          open
          onOpenChange={(open) => !open && setCropSource(null)}
          image={cropSource}
          aspect={1}
          cropShape="round"
          title={t("teamMember.profile.photo")}
          onApply={(result) => {
            set("avatarUrl", result.dataUrl);
            setCropSource(null);
          }}
          output={{ maxSize: 320 }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("teamMember.profile.firstName")} required error={errors.firstName}>
          <Input value={value.firstName} onChange={(event) => set("firstName", event.target.value)} data-testid="profile-first-name" />
        </Field>
        <Field label={t("teamMember.profile.lastName")} required error={errors.lastName}>
          <Input value={value.lastName} onChange={(event) => set("lastName", event.target.value)} data-testid="profile-last-name" />
        </Field>
        <Field label={t("teamMember.profile.phone")} required error={errors.phone}>
          <PhoneInput value={value.phone} onValueChange={(next) => set("phone", next)} defaultCountry="US" />
        </Field>
        <Field label={t("teamMember.profile.email")} required error={errors.email}>
          <Input type="email" value={value.email} onChange={(event) => set("email", event.target.value)} data-testid="profile-email" />
        </Field>
      </div>

      {isBarber ? (
        <>
          <Field label={t("teamMember.profile.description")} description={t("teamMember.profile.descriptionHint")}>
            <Textarea value={value.description} onChange={(event) => set("description", event.target.value)} rows={3} />
          </Field>
          <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
            <Switch checked={value.bookingVisible} onCheckedChange={(checked) => set("bookingVisible", checked)} data-testid="profile-visibility" />
            <span className="flex flex-col">
              <Text weight="medium">{t("teamMember.profile.visibility")}</Text>
              <Text variant="muted">{t("teamMember.profile.visibilityHint")}</Text>
            </span>
          </label>
          <Field label={t("teamMember.profile.levelRequired")} required error={errors.levelId}>
            <Select value={value.levelId ?? ""} onValueChange={(next) => set("levelId", next)}>
              <SelectTrigger data-testid="profile-level">
                <SelectValue placeholder={t("teamMember.profile.pickLevel")} />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("teamMember.profile.skills")} description={t("teamMember.profile.skillsHint")}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {value.skills.map((skill) => (
                  <Tag key={skill} label={skill} tone="info" removable onRemove={() => set("skills", value.skills.filter((item) => item !== skill))} />
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillDraft}
                  placeholder={t("teamMember.profile.skillsPlaceholder")}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" aria-label={t("teamMember.profile.skillsPlaceholder")} onClick={addSkill}>
                  <Plus />
                </Button>
              </div>
            </div>
          </Field>
          <Field label={t("teamMember.profile.galleryCount", { count: value.gallery.length })} description={t("teamMember.profile.galleryHint")}>
            <div className="space-y-3">
              {value.gallery.length > 0 && (
                <ul className="grid grid-cols-5 gap-2">
                  {value.gallery.map((src, index) => (
                    <li key={index} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={src} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        aria-label={t("common.delete")}
                        onClick={() => set("gallery", value.gallery.filter((_, i) => i !== index))}
                        className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {value.gallery.length < MAX_GALLERY && <UploadZone accept="image/*" multiple maxFiles={MAX_GALLERY - value.gallery.length} maxSizeMB={2} onChange={(files) => void addGallery(files)} />}
            </div>
          </Field>
        </>
      ) : (
        <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
          <Switch checked={value.isAlsoBarber} onCheckedChange={(checked) => set("isAlsoBarber", checked)} />
          <span className="flex flex-col">
            <Text weight="medium">{t("teamMember.profile.isAlsoBarber")}</Text>
            <Text variant="muted">{t("teamMember.profile.isAlsoBarberHint")}</Text>
          </span>
        </label>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ view */

export function ProfileView({ member, levels, showPrivate = true }: { member: TeamMember; levels: readonly Level[]; showPrivate?: boolean }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const isBarber = isBarberRole(member.role) || member.isAlsoBarber;
  const level = levels.find((item) => item.id === member.levelId);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard title={t("teamMember.profile.personal")} description={t("teamMember.profile.personalHint")}>
        {/* Entre colegas no viajan el contacto ni el código de acceso. */}
        {showPrivate && (
          <>
            <InfoRow icon={<Phone />} label={t("teamMember.profile.phone")}>
              {member.phone}
            </InfoRow>
            <InfoRow icon={<Mail />} label={t("teamMember.profile.email")}>
              {member.email}
            </InfoRow>
            <InfoRow icon={<KeyRound />} label={t("teamMember.profile.code")}>
              <span className="font-mono tracking-widest">{member.code}</span>
              <Text variant="caption">{t("teamMember.profile.codeHint")}</Text>
            </InfoRow>
          </>
        )}
        <InfoRow label={t("teamMember.profile.branches")}>{member.branchIds.map(branchName).join(" · ")}</InfoRow>
        <InfoRow label={t("teamMember.profile.memberSince")}>{formatDate(new Date(member.createdAt), { day: "numeric", month: "long", year: "numeric" })}</InfoRow>
      </InfoCard>
      <InfoCard title={t("teamMember.profile.details")} description={t("teamMember.profile.detailsHint")}>
        {isBarber ? (
          <>
            <InfoRow icon={member.bookingVisible ? <Eye /> : <EyeOff />} label={t("teamMember.profile.visibility")}>
              {member.bookingVisible ? t("teamMember.profile.enabled") : t("teamMember.profile.disabled")}
            </InfoRow>
            <InfoRow label={t("teamMember.profile.levelRequired")}>{level?.name ?? t("teamMember.noLevel")}</InfoRow>
            <InfoRow label={t("teamMember.profile.skills")}>
              {member.skills.length === 0 ? (
                t("teamMember.profile.none")
              ) : (
                <span className="flex flex-wrap gap-1.5 pt-1">
                  {member.skills.map((skill) => (
                    <Tag key={skill} label={skill} tone="info" />
                  ))}
                </span>
              )}
            </InfoRow>
            {member.description && <InfoRow label={t("teamMember.profile.description")}>{member.description}</InfoRow>}
            <InfoRow label={t("teamMember.profile.galleryCount", { count: member.gallery.length })}>
              {member.gallery.length === 0 ? (
                t("teamMember.profile.none")
              ) : (
                <ul className="grid grid-cols-5 gap-2 pt-1">
                  {member.gallery.map((src, index) => (
                    <li key={index} className="aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={src} alt={`${memberName(member)} ${index + 1}`} className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </InfoRow>
          </>
        ) : (
          <InfoRow label={t("teamMember.profile.isAlsoBarber")}>{member.isAlsoBarber ? t("teamMember.yes") : t("teamMember.no")}</InfoRow>
        )}
      </InfoCard>
    </div>
  );
}
