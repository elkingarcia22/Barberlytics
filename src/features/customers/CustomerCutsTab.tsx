import * as React from "react";
import { ImagePlus, Plus, Scissors, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { prepareReferencePhoto } from "@/features/booking/flow/referencePhoto";
import { InfoCard } from "@/features/team/teamShared";
import { CUT_FORMULA_KEYS, EMPTY_FORMULA, formulaLine, useCustomerCuts, useCutActions, type CutFormula, type CutFormulaKey, type CutRecord } from "./loyalty";

const DATE: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "long", year: "numeric" };
const MAX_PHOTOS = 4;
const FORMULA_LABELS: Readonly<Record<CutFormulaKey, AppMessageKey>> = {
  tool: "customers.cuts.tool",
  guard: "customers.cuts.guard",
  fade: "customers.cuts.fade",
  beard: "customers.cuts.beard",
  products: "customers.cuts.products",
  notes: "customers.cuts.notes",
};
const FORMULA_PLACEHOLDERS: Readonly<Record<CutFormulaKey, AppMessageKey>> = {
  tool: "customers.cuts.toolPlaceholder",
  guard: "customers.cuts.guardPlaceholder",
  fade: "customers.cuts.fadePlaceholder",
  beard: "customers.cuts.beardPlaceholder",
  products: "customers.cuts.productsPlaceholder",
  notes: "customers.cuts.notesPlaceholder",
};

/**
 * Los cortes del cliente: la fórmula (máquina, número, degradado, barba, producto) y las fotos del resultado de cada
 * visita, del más reciente al más viejo. Sirve para repetirlo igual aunque lo atienda otro barbero.
 */
export function CustomerCutsTab({ customerId }: { customerId: string }) {
  const t = useAppT();
  const cuts = useCustomerCuts(customerId);
  const [adding, setAdding] = React.useState(false);
  const [repeat, setRepeat] = React.useState<CutFormula | null>(null);

  return (
    <div className="space-y-stack" data-testid="customer-cuts">
      <div className="flex justify-end">
        <Button onClick={() => (setRepeat(null), setAdding(true))} data-testid="customer-cut-add">
          <Plus /> {t("customers.cuts.add")}
        </Button>
      </div>
      <QueryBoundary query={cuts} loading={<Skeleton className="h-40 w-full rounded-2xl" />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="scissors" title={t("customers.cuts.emptyTitle")} description={t("customers.cuts.emptyHint")} />
          ) : (
            <ul className="space-y-stack">
              {data.items.map((cut) => (
                <li key={cut.id}>
                  <CutCard customerId={customerId} cut={cut} onRepeat={() => (setRepeat(cut.formula), setAdding(true))} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
      {adding && <CutDrawer customerId={customerId} initial={repeat} onClose={() => setAdding(false)} />}
    </div>
  );
}

function CutCard({ customerId, cut, onRepeat }: { customerId: string; cut: CutRecord; onRepeat: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { remove } = useCutActions(customerId);
  const filled = CUT_FORMULA_KEYS.filter((key) => cut.formula[key].trim());
  return (
    <InfoCard
      title={formatDate(new Date(`${cut.date}T12:00:00`), DATE)}
      description={[cut.barber, t("customers.cuts.by", { name: cut.by })].filter(Boolean).join(" · ")}
      actions={
        <span className="flex gap-1">
          <Button size="xs" variant="outline" onClick={onRepeat}>
            <Scissors /> {t("customers.cuts.repeat")}
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label={t("customers.cuts.remove")} disabled={remove.isPending} onClick={() => remove.mutate(cut.id, { onError: (error) => toast.error(describeError(error).description) })}>
            <Trash2 />
          </Button>
        </span>
      }
    >
      {filled.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {filled.map((key) => (
            <div key={key} className={key === "notes" ? "sm:col-span-2" : undefined}>
              <dt className="text-xs text-text-muted">{t(FORMULA_LABELS[key])}</dt>
              <dd className="text-text-primary">{cut.formula[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {cut.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cut.photos.map((photo, index) => (
            <img key={index} src={photo} alt={t("customers.cuts.photoAlt", { index: index + 1 })} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
          ))}
        </div>
      )}
    </InfoCard>
  );
}

/** Anotar un corte: los campos de la fórmula (con «Repetir» llegan llenos) y hasta 4 fotos del resultado. */
function CutDrawer({ customerId, initial, onClose }: { customerId: string; initial: CutFormula | null; onClose: () => void }) {
  const t = useAppT();
  const { add } = useCutActions(customerId);
  const [formula, setFormula] = React.useState<CutFormula>(initial ?? EMPTY_FORMULA);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const empty = CUT_FORMULA_KEYS.every((key) => !formula[key].trim()) && photos.length === 0;

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    event.target.value = "";
    try {
      const ready = await Promise.all(files.map((file) => prepareReferencePhoto(file)));
      setPhotos((current) => [...current, ...ready].slice(0, MAX_PHOTOS));
    } catch {
      toast.error(t("customers.cuts.photoError"));
    }
  };

  const submit = () => {
    setError(null);
    add.mutate(
      { formula, photos },
      {
        onSuccess: () => {
          toast.success(t("customers.cuts.saved"), { description: formulaLine(formula) || undefined });
          onClose();
        },
        onError: (reason) => setError(describeError(reason).description),
      }
    );
  };

  return (
    <DrawerShell
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("customers.cuts.add")}
      description={t("customers.cuts.formHint")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={empty || add.isPending} data-testid="customer-cut-save">
            {t("customers.cuts.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-testid="customer-cut-form">
        <div className="grid gap-4 sm:grid-cols-2">
          {CUT_FORMULA_KEYS.filter((key) => key !== "notes").map((key) => (
            <Field key={key} label={t(FORMULA_LABELS[key])}>
              <Input value={formula[key]} onChange={(event) => setFormula({ ...formula, [key]: event.target.value })} placeholder={t(FORMULA_PLACEHOLDERS[key])} maxLength={200} autoComplete="off" data-testid={`customer-cut-${key}`} />
            </Field>
          ))}
        </div>
        <Field label={t(FORMULA_LABELS.notes)}>
          <Textarea value={formula.notes} onChange={(event) => setFormula({ ...formula, notes: event.target.value })} placeholder={t(FORMULA_PLACEHOLDERS.notes)} rows={3} maxLength={200} />
        </Field>
        <div className="space-y-2">
          <Text variant="label">{t("customers.cuts.photos")}</Text>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img src={photo} alt={t("customers.cuts.photoAlt", { index: index + 1 })} className="aspect-square w-full rounded-lg object-cover" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, position) => position !== index))} aria-label={t("customers.cuts.removePhoto")} className="absolute right-1 top-1 rounded-full bg-background/80 p-1">
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-text-muted transition-colors hover:border-primary hover:text-primary">
                <ImagePlus className="size-5" aria-hidden />
                {t("customers.cuts.addPhoto")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void pick(event)} aria-label={t("customers.cuts.addPhoto")} />
          <Text variant="muted">{t("customers.cuts.photosHint", { max: MAX_PHOTOS })}</Text>
        </div>
        {error && (
          <Text size="sm" tone="negative" role="alert">
            {error}
          </Text>
        )}
      </div>
    </DrawerShell>
  );
}
