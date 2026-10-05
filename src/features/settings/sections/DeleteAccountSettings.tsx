import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Info, TriangleAlert } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError, isApiError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccess } from "@/features/access";
import { useAuth } from "@/features/auth";
import { SettingsCard } from "../SettingsFormParts";
import { settingsApi } from "../settingsApi";
import { useSettingsSection } from "../settingsQueries";
import { companySchema } from "../settingsTypes";

const LOSSES: readonly AppMessageKey[] = ["cfg.delete.loss.clients", "cfg.delete.loss.calendar", "cfg.delete.loss.team", "cfg.delete.loss.sales", "cfg.delete.loss.plan"];

/**
 * Eliminar cuenta. Es lo único de la configuración que no se puede deshacer,
 * así que antes de pedir la confirmación dice qué se pierde, y la
 * confirmación obliga a escribir el nombre de la empresa: un clic de más no
 * borra un negocio.
 *
 * Borrar el negocio es solo del dueño. Para el resto la tarjeta es «Eliminar
 * mi usuario»: quitar su acceso sin tocar el negocio (en producción el barbero
 * veía una tarjeta que, por su texto, borraba la barbería entera).
 */
export function DeleteAccountSettings() {
  const { role } = useAccess();
  return role === "owner" ? <DeleteBusiness /> : <DeleteMyUser />;
}

/**
 * Quitar el propio acceso. Mientras el contrato no tenga `POST /me/delete`, la
 * baja la hace quien administra el equipo inactivando el perfil (como dice la
 * ayuda de producción); aquí se explica qué pasa y a quién pedírsela.
 */
function DeleteMyUser() {
  const t = useAppT();
  return (
    <SettingsCard title={t("cfg.deleteUser.title")} description={t("cfg.deleteUser.hint")}>
      <Alert data-testid="delete-user">
        <Info />
        <AlertTitle>{t("cfg.deleteUser.howTitle")}</AlertTitle>
        <AlertDescription>{t("cfg.deleteUser.how")}</AlertDescription>
      </Alert>
    </SettingsCard>
  );
}

function DeleteBusiness() {
  const t = useAppT();
  const company = useSettingsSection("company", companySchema);
  const { logout } = useAuth();
  const remove = useMutation({ mutationFn: settingsApi.deleteAccount });
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTyped("");
      setError(undefined);
    }
  };

  return (
    <QueryBoundary query={company} loading={<Skeleton className="h-56 w-full rounded-2xl" />}>
      {(data) => {
        const matches = typed.trim() === data.name;
        const submit = (event: React.FormEvent) => {
          event.preventDefault();
          if (!matches) return;
          remove.mutate(typed.trim(), {
            /* La cuenta ya no existe: la sesión se cierra y `RequireAuth` lleva al acceso. */
            onSuccess: () => void logout(),
            onError: (failure) => setError(isApiError(failure) && failure.fieldErrors?.confirmation ? failure.fieldErrors.confirmation[0] : describeError(failure).description),
          });
        };
        return (
          <>
            <SettingsCard title={t("cfg.delete.title")} description={t("cfg.delete.hint")} className="border-status-negative/30">
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>{t("cfg.delete.warningTitle")}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {LOSSES.map((key) => (
                      <li key={key}>{t(key)}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
              <div>
                <Button type="button" variant="destructive" onClick={() => setOpen(true)} data-testid="delete-account-open">
                  {t("cfg.delete.action")}
                </Button>
              </div>
            </SettingsCard>

            <ModalShell
              open={open}
              onOpenChange={close}
              title={t("cfg.delete.confirmTitle")}
              description={t("cfg.delete.confirmHint", { name: data.name })}
              actions={
                <>
                  <Button type="button" variant="outline" onClick={() => close(false)} disabled={remove.isPending}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" form="delete-account-form" variant="destructive" disabled={!matches || remove.isPending} data-testid="delete-account-confirm">
                    {t("cfg.delete.confirm")}
                  </Button>
                </>
              }
            >
              <form id="delete-account-form" onSubmit={submit}>
                <Field label={t("cfg.delete.typeName")} error={error}>
                  <Input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" spellCheck={false} data-testid="delete-account-input" />
                </Field>
              </form>
            </ModalShell>
          </>
        );
      }}
    </QueryBoundary>
  );
}
