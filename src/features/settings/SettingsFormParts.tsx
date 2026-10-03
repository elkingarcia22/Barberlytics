import * as React from "react";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { SectionHeader } from "@/components/utility";
import { useSaveSettingsSection, useSettingsSection } from "./settingsQueries";
import type { SettingsSectionId } from "./settingsTypes";

/**
 * Las piezas que comparten todos los ajustes: la tarjeta de un bloque, la
 * fila con interruptor, la barra de guardar y el documento —que carga el
 * ajuste, lleva el borrador y lo guarda—. Un ajuste nuevo solo pinta campos.
 */

export function SettingsCard({ title, description, actions, children, className }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-surface p-card shadow-card", className)}>
      <SectionHeader title={title} description={description} actions={actions} />
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export interface SwitchRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  testId?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/** Un interruptor con su explicación; lo que cuelga de él va debajo. */
export function SwitchRow({ label, hint, checked, onCheckedChange, testId, disabled, children }: SwitchRowProps) {
  const id = React.useId();
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={id} className="flex flex-col gap-0.5">
          <Text as="span" variant="label">
            {label}
          </Text>
          {hint && (
            <Text as="span" variant="muted" className="text-xs">
              {hint}
            </Text>
          )}
        </label>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} data-testid={testId} />
      </div>
      {children}
    </div>
  );
}

export type FieldErrors = Record<string, string | undefined>;

export interface SettingsDocumentContext<T> {
  draft: T;
  /** Lo último guardado, para comparar o para lo que no se edita. */
  saved: T;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  errors: FieldErrors;
}

export interface SettingsDocumentProps<T> {
  section: SettingsSectionId;
  schema: ZodType<T>;
  /** Errores que el formulario detecta antes de enviar; vacío = se puede guardar. */
  validate?: (draft: T) => FieldErrors;
  /** Lo que se manda al guardar, si no es el borrador tal cual. */
  toBody?: (draft: T) => unknown;
  children: (context: SettingsDocumentContext<T>) => React.ReactNode;
}

/**
 * Un ajuste de documento, de punta a punta: lo carga, lleva el borrador, dice
 * si hay cambios sin guardar y lo guarda entero. La barra de guardar solo
 * aparece cuando hay algo que guardar.
 */
export function SettingsDocument<T extends object>(props: SettingsDocumentProps<T>) {
  const query = useSettingsSection(props.section, props.schema);
  return (
    <QueryBoundary
      query={query}
      loading={
        <div className="space-y-stack" data-testid="settings-loading">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      }
    >
      {(data) => <DocumentForm {...props} saved={data} />}
    </QueryBoundary>
  );
}

function DocumentForm<T extends object>({ section, schema, validate, toBody, children, saved }: SettingsDocumentProps<T> & { saved: T }) {
  const t = useAppT();
  const save = useSaveSettingsSection(section, schema);
  const [draft, setDraft] = React.useState<T>(saved);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const set = React.useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key as string]: undefined }));
  }, []);

  const reset = () => {
    setDraft(saved);
    setErrors({});
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate?.(draft) ?? {};
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      return;
    }
    save.mutate(toBody ? toBody(draft) : draft, {
      onSuccess: (next) => {
        setDraft(next);
        setErrors({});
        toast.success(t("cfg.saved"));
      },
      onError: (error) => {
        const fields = isApiError(error) ? error.fieldErrors : undefined;
        if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([name, messages]) => [name, messages[0]])));
        else toast.error(describeError(error).title, { description: describeError(error).description });
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-stack pb-20" data-testid={`settings-${section}`}>
      {children({ draft, saved, set, errors })}
      {dirty && (
        <div className="sticky bottom-4 z-sticky flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur">
          <Text variant="muted">{t("cfg.unsaved")}</Text>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={reset} disabled={save.isPending}>
              <RotateCcw /> {t("cfg.discard")}
            </Button>
            <Button type="submit" disabled={save.isPending} data-testid="settings-save">
              <Check /> {t("cfg.save")}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
