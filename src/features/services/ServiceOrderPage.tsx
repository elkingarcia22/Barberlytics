import * as React from "react";
import { useNavigate } from "react-router";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail } from "@/components/action-rail";
import { Sortable } from "@/components/data-display/Sortable";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { PageHeader } from "@/components/utility";
import { useAccess } from "@/features/access";
import { catalogAccess } from "@/features/catalog/catalogAccess";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { useSaveServiceOrder, useServicesQuery } from "./queries";
import { ServiceGlyph } from "./servicesShared";
import { formatDuration } from "./servicesUtils";
import type { CatalogService, ServiceCategory, ServicesCatalog } from "./types";

/**
 * El orden en que el cliente ve el catálogo al reservar en línea: primero
 * las categorías y, dentro de cada una, sus servicios. Se arrastra desde el
 * asa o se mueve con las flechas del teclado, y se guarda todo de una vez.
 */
export function ServiceOrderPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const branchId = useBranchId();
  const catalog = useServicesQuery(branchId);

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("services.title"), onClick: () => navigate("/servicios") }, t("services.order.title")]} />
      </ShellHeaderSlot>
      <PageHeader title={t("services.order.title")} description={t("services.order.description")} />
      <QueryBoundary query={catalog}>{(data) => (data.items.length === 0 ? <EmptyState icon="scissors" title={t("services.emptyTitle")} description={t("services.emptyHint")} /> : <OrderEditor catalog={data} branchId={branchId} />)}</QueryBoundary>
    </div>
  );
}

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id).join();

function OrderEditor({ catalog, branchId }: { catalog: ServicesCatalog; branchId: string }) {
  const t = useAppT();
  // El orden de la reserva en línea va por «Servicios · Póngase en fila · Editar».
  const canOrder = catalogAccess(useAccess(), "services").canOrder;
  const formatMoney = useMoney();
  const save = useSaveServiceOrder(branchId);
  const [tab, setTab] = React.useState<"categories" | "services">("categories");
  const [categories, setCategories] = React.useState<ServiceCategory[] | null>(null);
  const [items, setItems] = React.useState<CatalogService[] | null>(null);
  const categoryList = categories ?? catalog.categories;
  const itemList = items ?? catalog.items;
  const withServices = categoryList.filter((category) => itemList.some((item) => item.categoryId === category.id));
  const [picked, setPicked] = React.useState<string>("");
  const categoryId = withServices.some((category) => category.id === picked) ? picked : (withServices[0]?.id ?? "");
  const inCategory = itemList.filter((item) => item.categoryId === categoryId);
  const dirty = ids(categoryList) !== ids(catalog.categories) || ids(itemList) !== ids(catalog.items);

  /* Reordenar dentro de una categoría recoloca solo sus servicios; el resto conserva su sitio. */
  const reorderInCategory = (next: CatalogService[]) => {
    const queue = [...next];
    setItems(itemList.map((item) => (item.categoryId === categoryId ? (queue.shift() as CatalogService) : item)));
  };

  const reset = () => {
    setCategories(null);
    setItems(null);
  };

  const persist = () =>
    save.mutate(
      { categoryIds: categoryList.map((item) => item.id), serviceIds: itemList.map((item) => item.id) },
      {
        onSuccess: () => {
          toast.success(t("services.order.saved"), { description: t("services.order.savedHint") });
          reset();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );

  return (
    <>
      <ThemaTabs
        className="mb-2"
        fitContent
        tabs={[
          { id: "categories", label: t("services.order.tab.categories") },
          { id: "services", label: t("services.order.tab.services") },
        ]}
        activeTabId={tab}
        onTabChange={(id) => setTab(id as "categories" | "services")}
      />

      {tab === "categories" ? (
        <Sortable
          items={categoryList}
          getId={(item) => item.id}
          getLabel={(item) => item.name}
          onReorder={setCategories}
          disabled={!canOrder}
          handle
          className="space-y-2"
          data-testid="category-order"
          renderItem={(item, state) => (
            <>
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-text-secondary">{state.index + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-text-primary">{item.name}</span>
                {item.description && <span className="truncate text-xs text-text-muted">{item.description}</span>}
              </span>
              <Badge variant="neutral">{t("services.category.count", { count: itemList.filter((service) => service.categoryId === item.id).length })}</Badge>
            </>
          )}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Text variant="label">{t("services.column.category")}</Text>
            <Select value={categoryId} onValueChange={setPicked}>
              <SelectTrigger className="w-60" aria-label={t("services.column.category")} data-testid="order-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {withServices.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Sortable
            items={inCategory}
            getId={(item) => item.id}
            getLabel={(item) => item.name}
            onReorder={reorderInCategory}
            disabled={!canOrder}
            handle
            className="space-y-2"
            data-testid="service-order"
            renderItem={(item, state) => (
              <>
                <span className="w-6 text-center text-sm font-semibold tabular-nums text-text-secondary">{state.index + 1}</span>
                <ServiceGlyph kind={item.kind} size="sm" imageUrl={item.imageUrl} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-text-primary">{item.name}</span>
                  <span className="text-xs text-text-muted">
                    {formatDuration(item.durationMin)} · {formatMoney(item.price)}
                  </span>
                </span>
                {item.visibility === "private" && <Badge variant="neutral">{t("services.order.notOnline")}</Badge>}
              </>
            )}
          />
        </div>
      )}

      {canOrder && (
      <ShellRailSlot>
        <DataListActionRail
          actions={[
            { id: "reset", label: t("services.order.reset"), icon: <RotateCcw className="size-5" strokeWidth={2} />, scope: ["screen"], blockedReason: dirty ? null : t("services.order.nothingToReset"), onSelect: reset },
            { id: "save", label: t("services.order.save"), icon: <Save className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, blockedReason: dirty ? null : t("services.order.nothingToSave"), onSelect: persist },
          ]}
          selectedCount={0}
          onClearSelection={() => undefined}
        />
      </ShellRailSlot>
      )}
    </>
  );
}
