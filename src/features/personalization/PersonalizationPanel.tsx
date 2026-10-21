import * as React from "react";
import { toast } from "sonner";
import { DEFAULT_SCREEN_ACTIONS_PLACEMENT, useActionsPlacement, type ActionsPlacement } from "@/components/action-rail";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { DEFAULT_LOCALE, LanguagePickerPanel, useLocale, useT, type LocaleId } from "@/i18n";
import { ThemeSelectorPanel, useTheme, type DefaultLogo, type StoredTheme } from "@/themes";

export interface PersonalizationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Arriba del color: el logo de la barbería y la puerta para cambiarlo. */
  leading?: React.ReactNode;
  /** El logo propio, para proponer sus colores en «Personalizado». */
  logoSrc?: string | null;
  /** El logo por defecto (colores e IA), para cuando no hay uno propio. */
  defaultLogo?: DefaultLogo;
}

/** Cómo estaba todo al abrir el panel: a esto vuelve si se cierra sin guardar. */
interface Baseline {
  theme: StoredTheme;
  locale: LocaleId;
  placement: ActionsPlacement;
}

/**
 * Personalización en un panel lateral que empuja la página: lo que se cambia se ve al
 * momento en la pantalla de al lado. «Guardar» se lo queda; cerrar sin guardar (la X o
 * Escape) lo deshace; «Restablecer» vuelve a lo de fábrica, también hasta guardar.
 * El logo es aparte: se sube y se restablece contra el servidor, no es una vista previa.
 */
export function PersonalizationPanel({ open, onOpenChange, leading, logoSrc, defaultLogo }: PersonalizationPanelProps) {
  const t = useT();
  // El cuerpo deja aquí cómo deshacer; Guardar lo vacía para que cerrar no deshaga nada.
  const revertRef = React.useRef<(() => void) | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) revertRef.current?.();
    onOpenChange(next);
  };

  return (
    <SidePanelShell open={open} onOpenChange={handleOpenChange} title={t("shell.personalization")} description={t("shell.personalization.description")}>
      <PersonalizationBody
        leading={leading}
        logoSrc={logoSrc}
        defaultLogo={defaultLogo}
        revertRef={revertRef}
        onSaved={() => {
          revertRef.current = null;
          onOpenChange(false);
        }}
      />
    </SidePanelShell>
  );
}

function PersonalizationBody({
  leading,
  logoSrc,
  defaultLogo,
  revertRef,
  onSaved,
}: Omit<PersonalizationPanelProps, "open" | "onOpenChange"> & { revertRef: React.RefObject<(() => void) | null>; onSaved: () => void }) {
  const t = useT();
  const { snapshot, restoreSnapshot, resetAppearance } = useTheme();
  const { locale, setLocale } = useLocale();
  const [placement, setPlacement] = useActionsPlacement();
  // El panel solo monta su cuerpo abierto: la foto se toma al abrirlo, una vez.
  const [baseline] = React.useState<Baseline>(() => ({ theme: snapshot, locale, placement }));

  React.useEffect(() => {
    revertRef.current = () => {
      restoreSnapshot(baseline.theme);
      setLocale(baseline.locale);
      setPlacement(baseline.placement);
    };
  }, [baseline, restoreSnapshot, setLocale, setPlacement, revertRef]);

  const dirty = JSON.stringify(snapshot) !== JSON.stringify(baseline.theme) || locale !== baseline.locale || placement !== baseline.placement;

  const reset = () => {
    resetAppearance();
    setLocale(DEFAULT_LOCALE);
    setPlacement(DEFAULT_SCREEN_ACTIONS_PLACEMENT);
    toast(t("shell.personalization.resetHint"));
  };

  return (
    <div className="space-y-6">
      {leading}
      <ThemeSelectorPanel advanced={false} logoSrc={logoSrc} defaultLogo={defaultLogo} />
      <LanguagePickerPanel />
      <SegmentedGroup<ActionsPlacement>
        data-testid="actions-placement"
        label={t("shell.actionsPlacement")}
        options={[
          { id: "rail", label: t("shell.actionsPlacement.rail") },
          { id: "inline", label: t("shell.actionsPlacement.inline") },
        ]}
        value={placement}
        onChange={setPlacement}
        hint={t(placement === "rail" ? "shell.actionsPlacement.railHint" : "shell.actionsPlacement.inlineHint")}
      />

      <PanelFooter>
        {dirty && (
          <p className="text-xs text-text-secondary" data-testid="personalization-unsaved">
            {t("shell.personalization.unsaved")}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={reset} data-testid="personalization-reset">
            {t("shell.personalization.reset")}
          </Button>
          <Button
            className="flex-1"
            data-testid="personalization-save"
            onClick={() => {
              toast.success(t("shell.personalization.saved"));
              onSaved();
            }}
          >
            {t("shell.personalization.save")}
          </Button>
        </div>
      </PanelFooter>
    </div>
  );
}
