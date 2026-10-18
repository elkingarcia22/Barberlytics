import * as React from "react";
import { CheckCircle2, ClipboardCheck, History, PackageMinus, PackagePlus, PackageX, TriangleAlert } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { DataListBlock } from "@/components/blocks";
import { ListItem } from "@/components/data-display/ListItem";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { AttentionAction, AttentionStrip } from "@/components/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAgo } from "@/features/customers/customersUtils";
import { inventoryCells, inventoryColumns } from "./inventoryHome";
import { StockBadge } from "./StockBadge";
import { STOCK_STATUS_KEYS, useInventory, type ManualKind, type StockItem, type StockStatus } from "./inventory";
import { ProductGlyph } from "./productsShared";
import { StockHistoryDialog } from "./StockHistoryDialog";
import { StockMovementDialog } from "./StockMovementDialog";

export interface InventoryViewProps {
  branchId: string;
  /** Entradas, conteos, mermas y el mínimo son de quien edita el catálogo; recepción solo consulta. */
  canEdit: boolean;
  /** El filtro por estado vive en la URL de la página. */
  status: StockStatus | null;
  onStatusChange: (status: StockStatus | null) => void;
}

const PAGE_SIZE = 10;

/**
 * Las existencias de la sucursal. Arriba, lo que hay que reponer (bajo el mínimo o agotado: lo
 * agotado ya no se ofrece en la reserva en línea); abajo, cada producto con cuántas hay, cuántas se
 * vendieron en 30 días y para cuántos días alcanzan a ese ritmo.
 */
export function InventoryView(props: InventoryViewProps) {
  const query = useInventory(props.branchId);
  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-96 w-full rounded-2xl" />}>
      {(data) => <InventoryBody {...props} items={data.items} />}
    </QueryBoundary>
  );
}

type Dialog = { kind: "move"; of: ManualKind; productId: string | null; nonce: number } | { kind: "history"; item: StockItem };

function InventoryBody({ branchId, canEdit, status, onStatusChange, items }: InventoryViewProps & { items: readonly StockItem[] }) {
  const t = useAppT();
  const { formatRelativeTime } = useLocale();
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [placement, setPlacement] = React.useState<TableActionsPlacement>("rail");

  const low = items.filter((item) => item.status === "low").length;
  const out = items.filter((item) => item.status === "out").length;
  const calm = low + out === 0;
  const rows = React.useMemo(() => (status ? items.filter((item) => item.status === status) : items), [items, status]);
  const single = selected.size === 1 ? items.find((item) => selected.has(item.productId)) : undefined;
  const columns = React.useMemo(() => inventoryColumns(t), [t]);
  const cells = React.useMemo(
    () =>
      inventoryCells(t, {
        formatAgo: (iso) => formatAgo(iso, formatRelativeTime),
      }),
    [t, formatRelativeTime]
  );

  const openMove = React.useCallback((of: ManualKind, productId: string | null) => setDialog({ kind: "move", of, productId, nonce: Date.now() }), []);
  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      ...(canEdit
        ? ([
            {
              id: "receive",
              label: t("inventory.action.receive"),
              icon: <PackagePlus className="size-4" strokeWidth={2.5} />,
              scope: ["screen", "single"],
              primary: true,
              onSelect: () => openMove("receive", single?.productId ?? null),
            },
            {
              id: "count",
              label: t("inventory.action.count"),
              icon: <ClipboardCheck className="size-5" strokeWidth={2} />,
              scope: ["screen", "single"],
              onSelect: () => openMove("count", single?.productId ?? null),
            },
            {
              id: "waste",
              label: t("inventory.action.waste"),
              icon: <PackageMinus className="size-5" strokeWidth={2} />,
              scope: ["single"],
              overflow: true,
              onSelect: () => openMove("waste", single?.productId ?? null),
            },
          ] satisfies RailActionSpec[])
        : []),
      {
        id: "history",
        label: t("inventory.action.history"),
        icon: <History className="size-5" strokeWidth={2} />,
        scope: ["single"],
        onSelect: () => single && setDialog({ kind: "history", item: single }),
      },
    ],
    [canEdit, openMove, single, t]
  );

  return (
    <>
      <AttentionStrip
        className="mb-section shrink-0"
        label={t("inventory.alert.aria")}
        tone={calm ? "positive" : "warning"}
        icon={calm ? CheckCircle2 : TriangleAlert}
        title={calm ? t("inventory.alert.calmTitle") : t("inventory.alert.title", { count: low + out })}
        detail={calm ? t("inventory.alert.calmDetail") : t("inventory.alert.detail")}
        data-testid="inventory-alert"
      >
        {(low > 0 || status === "low") && (
          <AttentionAction icon={TriangleAlert} label={t(STOCK_STATUS_KEYS.low)} hint={t("inventory.alert.lowHint")} value={low} tone="warning" active={status === "low"} onClick={() => onStatusChange(status === "low" ? null : "low")} />
        )}
        {(out > 0 || status === "out") && (
          <AttentionAction icon={PackageX} label={t(STOCK_STATUS_KEYS.out)} hint={t("inventory.alert.outHint")} value={out} tone="negative" active={status === "out"} onClick={() => onStatusChange(status === "out" ? null : "out")} />
        )}
      </AttentionStrip>

      <DataListBlock
        tableId="productos-existencias"
        title={t("inventory.listTitle")}
        noun={t("products.noun")}
        gender="m"
        rows={rows}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.productId}
        getRowLabel={(row) => row.name}
        searchBy={(row) => `${row.name} ${row.sku ?? ""}`}
        searchPlaceholder={t("products.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onActionsPlacementChange={setPlacement}
        recordActions={actions}
        emptyState={<p className="py-6 text-center text-sm text-text-muted">{t("inventory.empty")}</p>}
        renderListItem={(row, state) => (
          <ListItem
            leading={
              <span className="flex items-center gap-3">
                {state.checkbox}
                <ProductGlyph imageUrl={row.imageUrl} />
              </span>
            }
            title={row.name}
            description={t("inventory.listLine", {
              count: row.onHand,
              min: row.min,
              sold: row.sold30,
            })}
            actions={
              <>
                <StockBadge status={row.status} label={t(STOCK_STATUS_KEYS[row.status])} />
                {state.menu}
              </>
            }
            selected={state.selected}
          />
        )}
      />

      {placement === "rail" && (
        <ShellRailSlot>
          <DataListActionRail selectedCount={selected.size} onClearSelection={() => setSelected(new Set())} actions={actions} gender="m" isBlocked={dialog !== null} />
        </ShellRailSlot>
      )}

      {dialog?.kind === "move" && <StockMovementDialog key={dialog.nonce} open onOpenChange={(open) => !open && setDialog(null)} branchId={branchId} items={items} productId={dialog.productId} kind={dialog.of} />}
      {dialog?.kind === "history" && <StockHistoryDialog open onOpenChange={(open) => !open && setDialog(null)} branchId={branchId} item={dialog.item} canEdit={canEdit} />}
    </>
  );
}
