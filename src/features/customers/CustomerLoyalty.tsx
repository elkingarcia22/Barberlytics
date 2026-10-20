import * as React from "react";
import { Copy, Gift, Plus, Scissors, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoCard, InfoRow } from "@/features/team/teamShared";
import { formulaLine, useSetTags, useTagCatalog } from "./loyalty";
import type { CustomerDetail } from "./types";

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const MAX_TAGS = 12;

/** El último corte: la fórmula en una línea y sus fotos, para repetirlo igual. */
export function LastCutCard({ customer, onOpenCuts }: { customer: CustomerDetail; onOpenCuts: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const cut = customer.lastCut;
  return (
    <InfoCard
      title={t("customers.cuts.last")}
      actions={
        <Button size="xs" variant="ghost" onClick={onOpenCuts} data-testid="customer-last-cut-open">
          {cut ? t("customers.overview.seeAll") : <><Plus /> {t("customers.cuts.add")}</>}
        </Button>
      }
    >
      {cut ? (
        <div className="space-y-3" data-testid="customer-last-cut">
          <div className="flex items-start gap-2">
            <Scissors className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
            <span className="flex flex-col">
              <Text weight="medium">{formulaLine(cut.formula) || cut.formula.notes || t("customers.cuts.photosOnly")}</Text>
              <Text size="xs" tone="muted">
                {[formatDate(new Date(`${cut.date}T12:00:00`), DATE), cut.barber].filter(Boolean).join(" · ")}
              </Text>
            </span>
          </div>
          {cut.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {cut.photos.slice(0, 3).map((photo, index) => (
                <img key={index} src={photo} alt={t("customers.cuts.photoAlt", { index: index + 1 })} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Text variant="muted">{t("customers.cuts.emptyHint")}</Text>
      )}
    </InfoCard>
  );
}

/** Las etiquetas del cliente: se quitan con su ✕ y se suman escribiendo (con las que ya existen como sugerencia). */
export function CustomerTags({ customer, canEdit }: { customer: CustomerDetail; canEdit: boolean }) {
  const t = useAppT();
  const save = useSetTags(customer.id);
  const catalog = useTagCatalog();
  const [draft, setDraft] = React.useState("");
  const listId = React.useId();
  const tags = customer.tags;
  const update = (next: string[]) => save.mutate(next, { onError: (error) => toast.error(describeError(error).description) });
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const tag = draft.trim().toLowerCase().replace(/\s+/g, " ");
    if (!tag || tags.includes(tag)) return setDraft("");
    update([...tags, tag]);
    setDraft("");
  };

  return (
    <InfoCard title={t("customers.tags.title")} description={t("customers.tags.hint")}>
      <div className="flex flex-wrap gap-1.5" data-testid="customer-tags">
        {tags.length === 0 && <Text variant="muted">{t("customers.tags.empty")}</Text>}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            {canEdit && (
              <button type="button" onClick={() => update(tags.filter((item) => item !== tag))} aria-label={t("customers.tags.remove", { tag })} className="rounded-full p-0.5 hover:bg-foreground/10">
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {canEdit && tags.length < MAX_TAGS && (
        <form onSubmit={add} className="mt-3 flex gap-2">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} list={listId} placeholder={t("customers.tags.placeholder")} maxLength={24} aria-label={t("customers.tags.add")} className="h-8 flex-1" data-testid="customer-tag-input" />
          <datalist id={listId}>
            {(catalog.data?.items ?? []).filter((item) => !tags.includes(item.name)).map((item) => (
              <option key={item.name} value={item.name} />
            ))}
          </datalist>
          <Button type="submit" size="sm" variant="outline" disabled={!draft.trim() || save.isPending} data-testid="customer-tag-add">
            <Plus /> {t("customers.tags.add")}
          </Button>
        </form>
      )}
    </InfoCard>
  );
}

/** Su código de referido (para compartir), quién lo trajo y a cuántos trajo. */
export function ReferralCard({ customer, formatMoney, showMoney }: { customer: CustomerDetail; formatMoney: (value: number) => string; showMoney: boolean }) {
  const t = useAppT();
  const referral = customer.referral;
  if (!referral) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t("customers.referral.shareText", { code: referral.code }));
      toast.success(t("customers.referral.copied"));
    } catch {
      toast.error(t("customers.referral.copyFailed"));
    }
  };
  return (
    <InfoCard
      title={t("customers.referral.title")}
      actions={
        <Button size="xs" variant="outline" onClick={() => void copy()} data-testid="customer-referral-copy">
          <Copy /> {t("customers.referral.copy")}
        </Button>
      }
    >
      <InfoRow icon={<Gift />} label={t("customers.referral.code")}>
        <span className="font-mono font-semibold tracking-wide" data-testid="customer-referral-code">
          {referral.code}
        </span>
      </InfoRow>
      {referral.referredBy && <InfoRow label={t("customers.referral.referredBy")}>{referral.referredBy.name}</InfoRow>}
      <InfoRow label={t("customers.referral.brought")}>
        {t("customers.referral.broughtCount", { count: referral.referred })}
        {showMoney && referral.earned > 0 ? ` · ${t("customers.referral.earned", { amount: formatMoney(referral.earned) })}` : ""}
      </InfoRow>
    </InfoCard>
  );
}
