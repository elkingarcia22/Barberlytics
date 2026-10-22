import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/overlays";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility";
import { cn } from "@/lib/utils";
import { railActionsFor, type RailActionSpec } from "./railActions";
import { declaredRailLayout, RAIL_LAYOUT_SECONDARY_MAX, type RailLayout, type RailLayoutEditing } from "./railLayout";

/**
 * «Editar acciones»: la persona elige cuál es la acción principal de la barra
 * y hasta tres que se quedan a la vista, de entre todas las acciones de la
 * pantalla y sus filtros rápidos. Lo demás se pliega en «más acciones».
 *
 * Arriba, la barra como quedaría, para que la decisión se vea antes de
 * guardarla. «Restablecer» vuelve a lo que la pantalla trae de serie.
 */
export interface RailActionsEditorProps extends RailLayoutEditing {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RailActionsEditor({ open, onOpenChange, actions, layout, setLayout }: RailActionsEditorProps) {
  const screen = React.useMemo(() => railActionsFor(actions, 0), [actions]);
  const commands = screen.filter((action) => !action.filter);
  const filters = screen.filter((action) => action.filter);
  // Parte de lo guardado (o de lo que trae la pantalla). Quien lo abre lo monta al abrir, así cada vez empieza de nuevo.
  const [draft, setDraft] = React.useState<RailLayout>(() => layout ?? declaredRailLayout(actions));

  const byId = (id: string | null) => screen.find((action) => action.id === id);
  const full = draft.secondary.length >= RAIL_LAYOUT_SECONDARY_MAX;

  const choosePrimary = (id: string) => setDraft((current) => ({ primary: id, secondary: current.secondary.filter((item) => item !== id) }));
  const toggleSecondary = (id: string) =>
    setDraft((current) =>
      current.secondary.includes(id)
        ? { ...current, secondary: current.secondary.filter((item) => item !== id) }
        : current.secondary.length < RAIL_LAYOUT_SECONDARY_MAX
          ? { ...current, secondary: [...current.secondary, id] }
          : current
    );

  const secondaryRow = (action: RailActionSpec) => {
    const position = draft.secondary.indexOf(action.id);
    const checked = position !== -1;
    return (
      <SelectableRow
        key={action.id}
        role="checkbox"
        checked={checked}
        label={action.label}
        disabled={!checked && full}
        onClick={() => toggleSecondary(action.id)}
        leading={<IconTile icon={action.icon} tone={checked ? "primary" : "neutral"} size="sm" />}
      >
        <Text as="span" size="sm" weight="medium" truncate>
          {action.label}
        </Text>
        {checked && (
          <Text as="span" variant="caption">
            {`A la vista · ${position + 1}.ª`}
          </Text>
        )}
      </SelectableRow>
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Editar acciones"
      description={`Elige la acción principal y hasta ${RAIL_LAYOUT_SECONDARY_MAX} que se queden a la vista. Lo demás queda en «Más acciones».`}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setLayout(null);
              onOpenChange(false);
            }}
          >
            Restablecer
          </Button>
          <span className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setLayout(draft);
              onOpenChange(false);
            }}
            data-testid="rail-actions-save"
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <RailPreview primary={byId(draft.primary)} secondary={draft.secondary.map(byId).filter((action): action is RailActionSpec => action !== undefined)} />

        <section aria-labelledby="rail-editor-primary" className="space-y-1.5">
          <Text as="h3" id="rail-editor-primary" size="sm" weight="semibold">
            Acción principal
          </Text>
          <div role="radiogroup" aria-labelledby="rail-editor-primary" className="flex flex-col gap-0.5">
            {commands.map((action) => (
              <SelectableRow
                key={action.id}
                role="radio"
                checked={draft.primary === action.id}
                label={action.label}
                onClick={() => choosePrimary(action.id)}
                leading={<IconTile icon={action.icon} tone={draft.primary === action.id ? "primary" : "neutral"} size="sm" />}
              >
                <Text as="span" size="sm" weight="medium" truncate>
                  {action.label}
                </Text>
              </SelectableRow>
            ))}
          </div>
        </section>

        <section aria-labelledby="rail-editor-secondary" className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Text as="h3" id="rail-editor-secondary" size="sm" weight="semibold">
              A la vista
            </Text>
            <Text as="span" variant="caption" className="tabular-nums" aria-live="polite">
              {`${draft.secondary.length} de ${RAIL_LAYOUT_SECONDARY_MAX}`}
            </Text>
          </div>
          <div role="group" aria-labelledby="rail-editor-secondary" className="flex flex-col gap-0.5">
            {commands.filter((action) => action.id !== draft.primary).map(secondaryRow)}
          </div>
          {filters.length > 0 && (
            <>
              <Text as="h4" variant="caption" className="pt-2">
                Filtros rápidos: se encienden y se apagan desde la barra
              </Text>
              <div role="group" aria-label="Filtros rápidos" className="flex flex-col gap-0.5">
                {filters.map(secondaryRow)}
              </div>
            </>
          )}
        </section>
      </div>
    </ModalShell>
  );
}

/** La barra como quedaría: el «más», las de a la vista en su orden y la principal al final. */
function RailPreview({ primary, secondary }: { primary?: RailActionSpec; secondary: readonly RailActionSpec[] }) {
  return (
    <div aria-hidden="true" className="flex justify-center rounded-xl bg-surface-subtle p-3">
      <div className="flex items-center gap-1 rounded-2xl bg-surface-nav p-1.5 shadow-rail">
        <span className="flex size-10 items-center justify-center rounded-xl text-nav-foreground/60">
          <MoreHorizontal className="size-5" />
        </span>
        {secondary.map((action) => (
          <span key={action.id} className={cn("flex size-10 items-center justify-center rounded-xl text-nav-foreground/60 [&_svg]:size-5", action.filter && "ring-1 ring-inset ring-nav-foreground/20")}>
            {action.icon}
          </span>
        ))}
        {primary && (
          <span className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground [&_svg]:size-4">
            {primary.icon}
            {primary.label}
          </span>
        )}
      </div>
    </div>
  );
}
