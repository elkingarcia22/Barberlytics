import * as React from "react";
import { useAppT } from "@/app/i18n";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { PersonAvatar } from "../calendarShared";
import { InlineList, PanelField } from "../appointmentPanel/bookingStyle";
import type { Barber } from "../types";

/**
 * De quién es la ausencia o el bloqueo, como el barbero en «Crear cita»: un
 * campo con su foto que abre la lista en su sitio. Fijo (con candado) cuando
 * un barbero solo puede tocar su propia agenda.
 */
export function BarberField({ barbers, value, onChange, locked = false, lockedHint, testId }: { barbers: readonly Barber[]; value: string; onChange: (id: string) => void; locked?: boolean; lockedHint?: string; testId?: string }) {
  const t = useAppT();
  const [open, setOpen] = React.useState(false);
  const barber = barbers.find((item) => item.id === value);
  return (
    <>
      <PanelField
        eyebrow={t("calendar.panel.fields.barber")}
        value={barber?.name ?? ""}
        placeholder={t("calendar.create.pickBarber")}
        detail={barber?.level ?? undefined}
        leading={barber ? <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} /> : undefined}
        icon="users"
        round
        open={open}
        onOpen={locked ? undefined : () => setOpen((current) => !current)}
        locked={locked}
        lockedHint={lockedHint}
        testId={testId}
      />
      {open && (
        <InlineList title={t("calendar.panel.fields.barberTitle")} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("calendar.panel.fields.barber")}>
            {barbers.map((item) => (
              <SelectableRow
                key={item.id}
                role="radio"
                checked={item.id === value}
                label={item.name}
                leading={<PersonAvatar name={item.name} avatarUrl={item.avatarUrl} />}
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
              >
                <span className="flex flex-col">
                  <Text as="span" weight="medium">
                    {item.name}
                  </Text>
                  {item.level && (
                    <Text as="span" size="xs" tone="muted">
                      {item.level}
                    </Text>
                  )}
                </span>
              </SelectableRow>
            ))}
          </div>
        </InlineList>
      )}
    </>
  );
}
