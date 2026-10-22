import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Heading, Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";

/**
 * Lo que comparten las ventas del calendario (de producto y sin cita) con «Crear cita»: la tarjeta
 * teñida con lo que se va armando arriba y el icono de cada campo, apagado mientras está vacío.
 */

/** La cabecera de la tarjeta: qué es, lo que va quedando (grande) y una línea de contexto. */
export function SaleCardHead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
        {eyebrow}
      </Text>
      <Heading level={2} className="tabular-nums">
        {title}
      </Heading>
      <Text size="sm" tone="secondary">
        {lead}
      </Text>
    </div>
  );
}

/** La tarjeta teñida que lleva todo, como la de «Crear cita». */
export function SaleCard({ testId, children }: { testId: string; children: React.ReactNode }) {
  return (
    <section className="-mx-1 flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-3 sm:mx-0 sm:p-4" data-testid={testId}>
      {children}
    </section>
  );
}

/** El icono de un campo sin foto: apagado mientras está vacío, de color cuando ya tiene algo. */
export function FieldIcon({ icon: Icon, filled }: { icon: LucideIcon; filled: boolean }) {
  return <IconTile size="md" shape="rounded" tone={filled ? "primary" : "neutral"} icon={<Icon />} />;
}
