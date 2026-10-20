import * as React from "react";
import { BookmarkPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerGroups, useGroupActions } from "@/features/marketing/campaigns";
import { isEmptyFilter, sameFilters, type GroupFilters } from "./groupFilter";


export interface CustomerGroupsBarProps {
  /** Los filtros puestos en la lista. */
  filters: GroupFilters;
  /** Elegir un grupo pone sus filtros en la lista. */
  onApply: (filters: GroupFilters) => void;
  /** Recepción y gerencia guardan y borran grupos; el barbero solo los usa. */
  canManage: boolean;
}

/**
 * Los grupos guardados de Clientes: cada uno es un filtro con nombre («VIP con cera», «Le toca volver de Instagram»).
 * Tocarlo lo pone en la lista; con filtros puestos, «Guardar como grupo» les da nombre.
 */
export function CustomerGroupsBar({ filters, onApply, canManage }: CustomerGroupsBarProps) {
  const t = useAppT();
  const groups = useCustomerGroups();
  const { create, remove } = useGroupActions();
  const [naming, setNaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const items = groups.data?.items ?? [];
  const active = items.find((group) => sameFilters(group.filters, filters));
  const canSave = canManage && !isEmptyFilter(filters) && !active;
  if (items.length === 0 && !canSave) return null;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    create.mutate(
      { name: name.trim(), filters },
      {
        onSuccess: (group) => {
          toast.success(t("customers.groups.saved", { name: group.name, count: group.size }));
          setNaming(false);
          setName("");
        },
        onError: (reason) => setError(isApiError(reason) ? (reason.fieldErrors?.name?.[0] ?? describeError(reason).description) : describeError(reason).description),
      }
    );
  };

  return (
    <div role="group" aria-label={t("customers.groups.title")} className="mb-stack flex shrink-0 flex-wrap items-center gap-1.5" data-testid="customers-groups">
      <span className="mr-1 text-xs font-medium text-text-muted">{t("customers.groups.title")}</span>
      {items.map((group) => (
        <span key={group.id} className="inline-flex items-center">
          <Button size="xs" variant={active?.id === group.id ? "default" : "outline"} aria-pressed={active?.id === group.id} onClick={() => onApply(group.filters)} className={canManage ? "rounded-r-none" : undefined}>
            {group.name} <span className="tabular-nums opacity-70">{group.size}</span>
          </Button>
          {canManage && (
            <Button size="xs" variant="outline" className="rounded-l-none border-l-0 px-1.5" aria-label={t("customers.groups.remove", { name: group.name })} onClick={() => remove.mutate(group.id, { onError: (reason) => toast.error(describeError(reason).description) })}>
              <X />
            </Button>
          )}
        </span>
      ))}
      {canSave &&
        (naming ? (
          <form onSubmit={save} className="flex items-center gap-1.5">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("customers.groups.namePlaceholder")} maxLength={60} autoFocus aria-label={t("customers.groups.name")} aria-invalid={!!error} className="h-7 w-44 text-xs" data-testid="customers-group-name" />
            <Button type="submit" size="xs" disabled={name.trim().length < 2 || create.isPending} data-testid="customers-group-save">
              {t("customers.groups.save")}
            </Button>
            <Button type="button" size="xs" variant="ghost" onClick={() => (setNaming(false), setError(null))}>
              {t("common.cancel")}
            </Button>
            {error && <span className="text-xs text-status-negative">{error}</span>}
          </form>
        ) : (
          <Button size="xs" variant="ghost" onClick={() => setNaming(true)} data-testid="customers-group-new">
            <BookmarkPlus /> {t("customers.groups.saveCurrent")}
          </Button>
        ))}
    </div>
  );
}
