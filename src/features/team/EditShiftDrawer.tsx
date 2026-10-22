import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { DrawerShell } from "@/components/overlays";
import type { ShiftDay } from "@/components/scheduling";
import { useAccess } from "@/features/access";
import { ShiftEditor } from "./hours/ShiftEditor";
import { hoursAccess } from "./hours/shiftEditing";
import type { DayClosure, ScheduleImpact, WeekRow } from "./types";

/**
 * Cambiar el turno de un día desde la semana del equipo: el mismo editor que el drawer del
 * calendario (atajos, «solo este día» o «este y los siguientes», las citas que quedarían fuera).
 */

export interface EditShiftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: WeekRow | null;
  day: ShiftDay | null;
  /** Abrir una cita que quedaría fuera del turno nuevo. */
  onOpenAppointment: (item: ScheduleImpact) => void;
  /** El festivo o cierre de la sede ese día, si hay. */
  closure?: DayClosure | null;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function EditShiftDrawer({ open, onOpenChange, row, day, onOpenAppointment, closure = null }: EditShiftDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const access = useAccess();
  const source = row && day ? row.days.find((item) => item.date === format(day.date, "yyyy-MM-dd")) : undefined;
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={row ? t("hours.editor.title", { name: row.name.split(" ")[0] }) : t("teamHours.editTitle")}
      description={day ? capitalize(format(day.date, "EEEE, d 'de' MMMM", { locale: calendarLocale(locale) })) : undefined}
    >
      {row && day && source && (
        <ShiftEditor
          key={`${row.memberId}-${source.date}`}
          memberId={row.memberId}
          memberName={row.name}
          date={day.date}
          current={source.range}
          fixed={source.fixed ?? null}
          overridden={source.overridden}
          access={hoursAccess(access)}
          onDone={() => onOpenChange(false)}
          onOpenAppointment={onOpenAppointment}
          closure={closure}
        />
      )}
    </DrawerShell>
  );
}
