import { useAppT } from "@/app/i18n";
import { SidePanelShell } from "@/components/overlays";
import { useOpenKey } from "./calendarFormat";
import type { Appointment, CalendarDay } from "./types";
import type { ModelContext } from "./calendarModel";
import type { SlotSuggestion } from "./slotSuggestions";
import type { AgendaResource } from "./resourceModel";
import { useCreateDraft, type CreateAppointmentDraft, type CreateAppointmentInitial, type CreatePreview } from "./createAppointment/useCreateDraft";
import { CreateCardsBody } from "./createAppointment/CreateCardsBody";

export type { CreateAppointmentDraft, CreateAppointmentInitial, CreatePreview };

/**
 * Crear cita, en el panel que empuja la agenda, con la cara de «Arma la cita»
 * (`createAppointment/CreateCardsBody`). Tocar una franja vacía lo abre con el
 * barbero y la hora puestos. El motor (`useCreateDraft`) guarda lo elegido,
 * pinta en la agenda los huecos que propone y comprueba antes de crear.
 */

export interface CreateAppointmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  /** La sucursal: de ella salen las horas libres de otros días. */
  branchId: string;
  initial: CreateAppointmentInitial | null;
  now?: Date;
  /** El día que se ve en la agenda y sus citas: de ahí salen los huecos sugeridos. */
  viewDate?: Date;
  day?: CalendarDay;
  /** Los huecos que el panel propone ahora mismo, para pintarlos en la agenda. Vacío al cerrar. */
  onSuggestions?: (suggestions: readonly SlotSuggestion[], draft: CreateAppointmentDraft) => void;
  /** Dónde va a quedar la cita que se arma, para marcarla en la agenda e ir a ese día. */
  onPreview?: (preview: CreatePreview | null) => void;
  /** Se miró otro día en el panel: la agenda se va a ese día. */
  onShowDay?: (day: Date) => void;
  /** Si quien agenda sigue las reglas de la casa. Sin ellas puede pisar otra cita o salirse del horario. */
  enforceRules?: boolean;
  /** Los recursos especiales (sillón de lavado…): se avisa si a esa hora ya están completos. */
  resources?: readonly AgendaResource[];
  onCreated: (appointment: Appointment) => void;
  onCreateClient: () => void;
}

/** Cada apertura arranca del hueco que se tocó (o en blanco): el panel se remonta con una llave nueva. */
export function CreateAppointmentDrawer(props: CreateAppointmentDrawerProps) {
  return <CreateAppointmentPanel key={useOpenKey(props.open)} {...props} />;
}

function CreateAppointmentPanel(props: CreateAppointmentDrawerProps) {
  const t = useAppT();
  const { open, onOpenChange } = props;
  const draft = useCreateDraft({ ...props, onClose: () => onOpenChange(false) });
  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.create.title")}>
      <div data-testid="create-appointment">
        <CreateCardsBody draft={draft} branchId={props.branchId} onCreateClient={props.onCreateClient} />
      </div>
    </SidePanelShell>
  );
}
