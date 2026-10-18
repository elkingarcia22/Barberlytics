import * as React from "react";
import { FileUp, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { parseCsv } from "@/lib/csvParse";
import { Field } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { guessColumns, rowsFrom, type ColumnMap, type ImportField } from "./importColumns";
import { useImportCustomers, useUndoImport, type ImportReason, type ImportResult } from "./importApi";

export interface CustomerImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

const NONE = "none";
const MAX_FILE_BYTES = 2_000_000;
const PREVIEW_ROWS = 3;
const REJECTED_SHOWN = 20;
const FIELDS: readonly ImportField[] = ["name", "firstName", "lastName", "phone", "email", "birthDate", "note"];
const FIELD_KEYS: Readonly<Record<ImportField, AppMessageKey>> = {
  name: "customers.import.field.name",
  firstName: "customers.import.field.firstName",
  lastName: "customers.import.field.lastName",
  phone: "customers.import.field.phone",
  email: "customers.import.field.email",
  birthDate: "customers.import.field.birthDate",
  note: "customers.import.field.note",
};
const REASON_KEYS: Readonly<Record<ImportReason, AppMessageKey>> = {
  name: "customers.import.reason.name",
  phone: "customers.import.reason.phone",
  email: "customers.import.reason.email",
  birthDate: "customers.import.reason.birthDate",
  duplicate: "customers.import.reason.duplicate",
};

/**
 * Traer los clientes de otro software sin pedírselos a soporte: se sube el CSV, se revisa qué columna
 * es cada dato (se adivina sola), se ve qué no entra y por qué, y se importa. La tanda se puede
 * deshacer. Excel se guarda antes como CSV.
 */
export function CustomerImportDrawer({ open, onOpenChange, branchId }: CustomerImportDrawerProps) {
  const t = useAppT();
  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="lg" title={t("customers.import.title")} description={t("customers.import.description")}>
      {open && <ImportBody branchId={branchId} onDone={() => onOpenChange(false)} />}
    </DrawerShell>
  );
}

function ImportBody({ branchId, onDone }: { branchId: string; onDone: () => void }) {
  const t = useAppT();
  const importer = useImportCustomers(branchId);
  const undo = useUndoImport();
  const [table, setTable] = React.useState<string[][] | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [map, setMap] = React.useState<ColumnMap>({});
  const [review, setReview] = React.useState<ImportResult | null>(null);
  const [done, setDone] = React.useState<ImportResult | null>(null);

  const header = table?.[0] ?? [];
  const body = React.useMemo(() => table?.slice(1) ?? [], [table]);
  const rows = React.useMemo(() => rowsFrom(body, map), [body, map]);
  const ready = map.phone !== undefined && (map.name !== undefined || map.firstName !== undefined);

  const pick = async (file: File | undefined) => {
    setFileError(null);
    setReview(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setFileError(t("customers.import.tooBig"));
    if (!/\.(csv|txt)$/i.test(file.name)) return setFileError(t("customers.import.onlyCsv"));
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) return setFileError(t("customers.import.empty"));
    setFileName(file.name);
    setTable(parsed);
    setMap(guessColumns(parsed[0]));
  };

  const setColumn = (field: ImportField, value: string) => {
    setReview(null);
    setMap((current) => {
      const next = { ...current };
      if (value === NONE) delete next[field];
      else next[field] = Number(value);
      return next;
    });
  };

  const fail = (error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description });
  const check = () => importer.mutate({ rows, dryRun: true }, { onSuccess: setReview, onError: fail });
  const run = () =>
    importer.mutate(
      { rows, dryRun: false },
      {
        onSuccess: (result) => {
          setDone(result);
          toast.success(t("customers.import.done", { count: result.created }));
        },
        onError: fail,
      }
    );
  const revert = () =>
    done?.batchId &&
    undo.mutate(done.batchId, {
      onSuccess: (result) => {
        toast.success(t("customers.import.undone", { count: result.removed }));
        onDone();
      },
      onError: fail,
    });

  if (done) {
    return (
      <div className="space-y-4" data-testid="customer-import-done">
        <Alert>
          <AlertDescription>{t("customers.import.done", { count: done.created })}</AlertDescription>
        </Alert>
        <RejectedList result={done} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDone}>{t("common.close")}</Button>
          {done.batchId && done.created > 0 && (
            <Button variant="outline" onClick={revert} disabled={undo.isPending} data-testid="customer-import-undo">
              <Undo2 /> {t("customers.import.undo")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="customer-import">
      <Field label={t("customers.import.file")} description={t("customers.import.fileHint")} error={fileError ?? undefined}>
        <Input type="file" accept=".csv,text/csv,.txt" onChange={(event) => void pick(event.target.files?.[0])} data-testid="customer-import-file" />
      </Field>

      {table && (
        <>
          <Text variant="muted">{t("customers.import.loaded", { name: fileName, count: body.length })}</Text>
          <section aria-label={t("customers.import.columns")} className="space-y-3">
            <Text variant="label">{t("customers.import.columns")}</Text>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <Field key={field} label={t(FIELD_KEYS[field])} required={field === "phone"}>
                  <Select value={map[field] === undefined ? NONE : String(map[field])} onValueChange={(value) => setColumn(field, value)}>
                    <SelectTrigger data-testid={`customer-import-map-${field}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("customers.import.notInFile")}</SelectItem>
                      {header.map((cell, index) => (
                        <SelectItem key={`${cell}-${index}`} value={String(index)}>
                          {cell || t("customers.import.column", { number: index + 1 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ))}
            </div>
          </section>

          {ready ? (
            <section aria-label={t("customers.import.preview")} className="space-y-2">
              <Text variant="label">{t("customers.import.preview")}</Text>
              <ul className="divide-y divide-border/60 text-sm" data-testid="customer-import-preview">
                {rows.slice(0, PREVIEW_ROWS).map((row, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-x-4 py-1.5">
                    <span className="font-medium text-text-primary">{row.name || "—"}</span>
                    <span className="tabular-nums text-text-secondary">{row.phone || "—"}</span>
                    <span className="text-text-muted">{row.email}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Alert>
              <AlertDescription>{t("customers.import.needs")}</AlertDescription>
            </Alert>
          )}

          {review && (
            <section aria-label={t("customers.import.review")} className="space-y-2" data-testid="customer-import-review">
              <Text weight="semibold">{t("customers.import.willCreate", { count: review.created })}</Text>
              <RejectedList result={review} />
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            {!review ? (
              <Button onClick={check} disabled={!ready || importer.isPending} data-testid="customer-import-check">
                {t("customers.import.check")}
              </Button>
            ) : (
              <Button onClick={run} disabled={review.created === 0 || importer.isPending} data-testid="customer-import-run">
                <FileUp /> {t("customers.import.run", { count: review.created })}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RejectedList({ result }: { result: ImportResult }) {
  const t = useAppT();
  if (result.rejected.length === 0) return null;
  return (
    <div className="space-y-1">
      <Text variant="muted">{t("customers.import.rejected", { count: result.rejected.length })}</Text>
      <ul className="max-h-48 overflow-y-auto text-sm" data-testid="customer-import-rejected">
        {result.rejected.slice(0, REJECTED_SHOWN).map((item) => (
          <li key={item.row} className="flex justify-between gap-3 py-0.5">
            <span className="truncate text-text-secondary">{t("customers.import.rowLabel", { row: item.row + 1, name: item.name || "—" })}</span>
            <span className="shrink-0 text-xs text-status-warning">{t(REASON_KEYS[item.reason])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
