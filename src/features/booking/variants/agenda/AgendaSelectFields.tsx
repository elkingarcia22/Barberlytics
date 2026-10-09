import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "../../flow/BookingContext";
import type { BookingBarber } from "../../types";
import { AgendaBarberField } from "./AgendaBarberField";
import { AgendaBranchField } from "./AgendaBranchField";
import { AgendaServiceField } from "./AgendaServicePicker";

interface AgendaSelectFieldsProps {
  /** Quienes hacen lo elegido, ya ordenados (el de siempre primero). */
  barbers: readonly BookingBarber[];
  usualId: string | null;
  /** «Lo de siempre», si aplica: el atajo junto a los servicios. */
  onUsual?: () => void;
}

/** Una pregunta con su campo debajo: el mismo título para todas. */
function FieldSection({ id, label, aside, children }: { id: string; label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Text id={id} size="sm" weight="medium">
          {label}
        </Text>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Las preguntas de la Agenda con selector, en orden: dónde, qué y con quién.
 * Cada una es un campo que abre su lista; las horas van aparte, debajo.
 */
export function AgendaSelectFields({ barbers, usualId, onUsual }: AgendaSelectFieldsProps) {
  const t = useAppT();
  const { shop } = useBookingFlow();
  return (
    <div className="flex flex-col gap-5">
      {shop.branches.length > 1 && (
        <FieldSection id="agenda-where" label={t("booking.agenda.whereLabel")}>
          <AgendaBranchField labelledBy="agenda-where" />
        </FieldSection>
      )}
      <FieldSection
        id="agenda-what"
        label={t("booking.agenda.whatTitle")}
        aside={
          onUsual && (
            <Button type="button" variant="ghost" size="sm" className="-mr-2 text-primary" onClick={onUsual}>
              <ThemaIcon name="refresh" />
              {t("booking.agenda.usual")}
            </Button>
          )
        }
      >
        <AgendaServiceField labelledBy="agenda-what" />
      </FieldSection>
      <FieldSection id="agenda-who" label={t("booking.agenda.whoLabel")}>
        <AgendaBarberField labelledBy="agenda-who" barbers={barbers} usualId={usualId} />
      </FieldSection>
    </div>
  );
}
