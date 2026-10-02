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
}

/** «Logo» dentro de Personalización: el isologo actual y la puerta para cambiarlo. */
export function BrandLogoSection({ logo, name, onChange }: BrandLogoSectionProps) {
  const titleId = React.useId();

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
    </section>
  );
}
