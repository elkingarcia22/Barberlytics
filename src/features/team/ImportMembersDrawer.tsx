import * as React from "react";
import { FileUp, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { TEAM_ROLE_KEYS } from "./types";
import type { ImportMembersResult } from "./api";
import { MAX_IMPORT_ROWS, parseMemberList } from "./memberImport";
import { useImportMembers } from "./queries";

export interface ImportMembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

const EXAMPLE = "Nombre,Apellido,Celular,Correo,Rol\nMateo,Ríos,3001112233,mateo@correo.com,barbero\nSara,Gil,3004445566,sara@correo.com,recepción";

/**
 * Sumar a varias personas de una vez: se pega la lista (o se sube un CSV), se ve qué entra y qué no, y
 * entran como invitadas. Dueño y administrador no se cargan en lista: se dan uno a uno.
 */
export function ImportMembersDrawer({ open, onOpenChange, branchId }: ImportMembersDrawerProps) {
  const t = useAppT();
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<ImportMembersResult | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const importMembers = useImportMembers();
  const parsed = React.useMemo(() => parseMemberList(text), [text]);

  const close = () => {
    onOpenChange(false);
    setText("");
    setResult(null);
  };
  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setText(await file.text());
    event.target.value = "";
  };
  const submit = () =>
    importMembers.mutate(
      { branchId, items: parsed.rows },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.created.length > 0) toast.success(t("team.import.done", { count: data.created.length }), { description: t("team.import.doneHint") });
          if (data.rejected.length === 0) close();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );

  return (
    <DrawerShell
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="lg"
      title={t("team.import.title")}
      description={t("team.import.description")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={parsed.rows.length === 0 || importMembers.isPending} data-testid="team-import-submit">
            <Upload /> {t("team.import.submit", { count: parsed.rows.length })}
          </Button>
        </>
      }
    >
      <div className="space-y-5" data-testid="team-import">
        <Field label={t("team.import.list")} description={t("team.import.listHint", { max: MAX_IMPORT_ROWS })}>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} placeholder={EXAMPLE} className="font-mono text-xs" data-testid="team-import-text" />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp /> {t("team.import.file")}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={pickFile} aria-label={t("team.import.file")} />
          {text.trim() && (
            <Text variant="muted" data-testid="team-import-summary">
              {t("team.import.summary", { ok: parsed.rows.length, bad: parsed.problems.length })}
            </Text>
          )}
        </div>
        {parsed.rows.length > 0 && (
          <ul className="divide-y divide-border/60 rounded-lg border border-border text-sm" data-testid="team-import-preview">
            {parsed.rows.slice(0, 8).map((row, index) => (
              <li key={`${row.email}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                <span className="font-medium text-text-primary">
                  {row.firstName} {row.lastName}
                </span>
                <span className="text-xs text-text-muted">
                  {t(TEAM_ROLE_KEYS[row.role])} · {row.email}
                </span>
              </li>
            ))}
            {parsed.rows.length > 8 && <li className="px-3 py-2 text-xs text-text-muted">{t("team.import.more", { count: parsed.rows.length - 8 })}</li>}
          </ul>
        )}
        {parsed.problems.length > 0 && (
          <Alert data-testid="team-import-problems">
            <TriangleAlert />
            <AlertTitle>{t("team.import.problems", { count: parsed.problems.length })}</AlertTitle>
            <AlertDescription>
              {parsed.problems
                .slice(0, 5)
                .map((problem) => t(problem.reason === "role" ? "team.import.badRole" : "team.import.missing", { row: problem.row }))
                .join(" · ")}
            </AlertDescription>
          </Alert>
        )}
        {parsed.truncated && <Text variant="muted">{t("team.import.truncated", { max: MAX_IMPORT_ROWS })}</Text>}
        {result && result.rejected.length > 0 && (
          <Alert variant="destructive" data-testid="team-import-rejected">
            <TriangleAlert />
            <AlertTitle>{t("team.import.rejected", { count: result.rejected.length })}</AlertTitle>
            <AlertDescription>
              <ul className="space-y-0.5">
                {result.rejected.map((item) => (
                  <li key={item.row}>{t("team.import.rejectedRow", { row: item.row, message: item.message })}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DrawerShell>
  );
}
