import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * PERMISSION MATRIX
 *
 * Lo que una persona (o un rol) puede hacer, por bloques: cada fila es una
 * función y cada columna una acción (ver, crear, editar, borrar, activo).
 * No todas las filas tienen todas las columnas: la casilla que no existe se
 * dibuja vacía. Sin `onChange` es solo lectura y enseña marcas en vez de
 * casillas.
 */

export interface PermissionColumnSpec {
  id: string;
  label: string;
}

export interface PermissionRow {
  id: string;
  label: string;
  /** Qué columnas existen en esta fila. */
  columns: readonly string[];
}

export interface PermissionBlock {
  id: string;
  label: string;
  rows: readonly PermissionRow[];
}

export type PermissionValue = Record<string, Partial<Record<string, boolean>>>;

export interface PermissionMatrixProps {
  blocks: readonly PermissionBlock[];
  columns: readonly PermissionColumnSpec[];
  value: PermissionValue;
  onChange?: (value: PermissionValue) => void;
  className?: string;
}

/** Marca o desmarca todas las casillas de un bloque. */
function setBlock(value: PermissionValue, block: PermissionBlock, granted: boolean): PermissionValue {
  const next = { ...value };
  for (const row of block.rows) next[row.id] = Object.fromEntries(row.columns.map((column) => [column, granted]));
  return next;
}

function blockState(value: PermissionValue, block: PermissionBlock): "all" | "none" | "some" {
  let granted = 0;
  let total = 0;
  for (const row of block.rows) {
    for (const column of row.columns) {
      total += 1;
      if (value[row.id]?.[column]) granted += 1;
    }
  }
  if (granted === 0) return "none";
  return granted === total ? "all" : "some";
}

export function PermissionMatrix({ blocks, columns, value, onChange, className }: PermissionMatrixProps) {
  const t = useT();
  const readOnly = !onChange;

  const toggle = (rowId: string, column: string, granted: boolean) => {
    onChange?.({ ...value, [rowId]: { ...value[rowId], [column]: granted } });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block) => {
        const state = blockState(value, block);
        return (
          <table key={block.id} className="w-full border-collapse overflow-hidden rounded-xl border border-border bg-surface text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th scope="col" className="px-3 py-2 text-left">
                  <span className="flex items-center gap-2">
                    {!readOnly && (
                      <Checkbox
                        aria-label={t("permissions.wholeBlock", { block: block.label })}
                        checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
                        onCheckedChange={(checked) => onChange?.(setBlock(value, block, checked === true))}
                      />
                    )}
                    <span className="font-semibold text-text-primary">{block.label}</span>
                  </span>
                </th>
                {columns.map((column) => (
                  <th key={column.id} scope="col" className="w-20 px-2 py-2 text-center text-xs font-semibold text-text-secondary">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                  <th scope="row" className="px-3 py-2 text-left font-normal text-text-secondary">
                    {row.label}
                  </th>
                  {columns.map((column) => {
                    const exists = row.columns.includes(column.id);
                    const granted = Boolean(value[row.id]?.[column.id]);
                    const label = `${row.label} · ${column.label}`;
                    return (
                      <td key={column.id} className="px-2 py-2 text-center">
                        {!exists ? (
                          <span className="sr-only">{t("permissions.notApplicable")}</span>
                        ) : readOnly ? (
                          granted ? (
                            <Check className="mx-auto size-4 text-success" aria-label={`${label}: ${t("permissions.granted")}`} />
                          ) : (
                            <Minus className="mx-auto size-4 text-text-muted/60" aria-label={`${label}: ${t("permissions.denied")}`} />
                          )
                        ) : (
                          <Checkbox aria-label={label} checked={granted} onCheckedChange={(checked) => toggle(row.id, column.id, checked === true)} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}
