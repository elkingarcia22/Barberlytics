import { Ban, CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { ModalShell } from "@/components/overlays";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { Text } from "@/components/typography";
import { findBarber, type ModelContext } from "./calendarModel";
import { BLOCK_CATEGORY_KEYS, type TimeBlock } from "./types";

/**
 * Lo que se hace al tocar un bloqueo, para quien agenda sin las reglas de la
 * casa (dueño, administrador, recepción, barbero de renta): agendar una cita
 * encima de todos modos, editarlo o quitarlo. El barbero de comisión no lo ve:
 * para él un bloqueo sigue siendo solo eso.
 */

export interface BlockOptionsDialogProps {
  block: TimeBlock | null;
  ctx: ModelContext;
  onOpenChange: (open: boolean) => void;
  onCreate: (block: TimeBlock) => void;
  onEdit: (block: TimeBlock) => void;
  /** Sin permiso para quitarlo, la opción no sale. */
  onRemove?: (block: TimeBlock) => void;
}

export function BlockOptionsDialog({ block, ctx, onOpenChange, onCreate, onEdit, onRemove }: BlockOptionsDialogProps) {
  const t = useAppT();
  const barber = block ? findBarber(ctx.catalog, block.barberId) : undefined;
  return (
    <ModalShell
      open={block !== null}
      onOpenChange={onOpenChange}
      size="sm"
      title={block ? t(BLOCK_CATEGORY_KEYS[block.category]) : ""}
      description={block ? t("calendar.blockOptions.when", { barber: barber?.name ?? "", from: block.startTime, to: block.endTime }) : undefined}
    >
      {block && (
        <div className="flex flex-col gap-2" data-testid="block-options">
          {block.description && (
            <Text size="sm" tone="secondary" className="border-l-2 border-border pl-3 italic">
              «{block.description}»
            </Text>
          )}
          <ActionTile
            leading={<IconTile size="md" shape="circle" tone="primary" icon={<CalendarPlus />} />}
            title={t("calendar.blockOptions.create")}
            description={t("calendar.blockOptions.createHint")}
            onClick={() => onCreate(block)}
            data-testid="block-options-create"
          />
          <ActionTile
            leading={<IconTile size="md" shape="circle" tone="neutral" icon={<Pencil />} />}
            title={t("calendar.blockOptions.edit")}
            description={t("calendar.blockOptions.editHint")}
            onClick={() => onEdit(block)}
            data-testid="block-options-edit"
          />
          {onRemove && (
            <ActionTile
              leading={<IconTile size="md" shape="circle" tone="negative" icon={<Trash2 />} />}
              title={t("calendar.blockOptions.remove")}
              description={t("calendar.blockOptions.removeHint")}
              onClick={() => onRemove(block)}
              data-testid="block-options-remove"
            />
          )}
          <Text size="xs" tone="muted" className="flex items-center gap-1.5 pt-1">
            <Ban className="size-3.5" aria-hidden="true" />
            {t("calendar.blockOptions.note")}
          </Text>
        </div>
      )}
    </ModalShell>
  );
}
