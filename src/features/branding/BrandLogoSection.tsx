import * as React from "react";
import { BrandSlot, type ShellBrandLogo } from "@/components/app-shell";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";

export interface BrandLogoSectionProps {
  logo: ShellBrandLogo | null;
  name: string;
  /** Lleva a Identidad de marca, donde se sube y recorta el logo. */
  onChange: () => void;
  /** Quita el logo propio y vuelve al de Barberlytics. Solo se ofrece si hay un logo propio. */
  onReset?: () => void;
  /** Mientras se guarda el restablecimiento. */
  isResetting?: boolean;
}

/**
 * «Logo» dentro de Personalización: el isologo actual, la puerta para cambiarlo y, si la
 * barbería subió uno, volver al de Barberlytics. Restablecer borra el archivo subido, así
 * que se confirma ahí mismo antes de hacerlo.
 */
export function BrandLogoSection({ logo, name, onChange, onReset, isResetting = false }: BrandLogoSectionProps) {
  const titleId = React.useId();
  const [confirming, setConfirming] = React.useState(false);

  return (
    <section aria-labelledby={titleId} className="space-y-2.5" data-testid="personalization-logo">
      <Text id={titleId} size="xs" weight="semibold" tone="muted" className="uppercase tracking-widest">
        Logo
      </Text>
      <div className="flex items-center gap-3">
        <BrandSlot variant="icon" logo={logo} name={name} />
        <Text size="sm" weight="semibold" className="min-w-0 flex-1 truncate">
          {name}
        </Text>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onChange} data-testid="personalization-logo-change">
          <ThemaIcon name="image" size="sm" />
          Cambiar
        </Button>
      </div>
      {logo && onReset && !confirming && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)} data-testid="personalization-logo-reset">
          <ThemaIcon name="refresh" size="sm" />
          Restablecer logo de Barberlytics
        </Button>
      )}
      {logo && onReset && confirming && (
        <div role="group" aria-label="Confirmar restablecer el logo" className="space-y-2 rounded-lg border border-border/70 bg-surface-subtle p-3">
          <Text size="xs" tone="secondary">
            Se quita tu logo y el menú vuelve a mostrar el de Barberlytics. Para usar el tuyo otra vez tendrás que subirlo de nuevo.
          </Text>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isResetting}
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
              data-testid="personalization-logo-reset-confirm"
            >
              Restablecer
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
