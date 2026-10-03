import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Barcode, CalendarClock, FolderTree, Globe, Pencil, Percent, Power, PowerOff, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { MetricCard } from "@/components/charts";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { marginOf } from "@/features/services/servicesUtils";
import { InfoCard, InfoRow } from "@/features/team/teamShared";
import { useBranchId } from "@/features/team/teamUtils";
import { ProductFormDrawer } from "./ProductFormDrawer";
import { categoryName, profitOf } from "./productsHome";
import { ProductActiveBadge, ProductGlyph, ProductVisibilityBadge, SellableBadge } from "./productsShared";
import { useProductQuery, useProductsQuery, useRemoveProduct, useSetProductsActive } from "./queries";
import type { CatalogProduct, ProductCategory } from "./types";

/**
 * La ficha de un producto, en una sola pantalla: lo que antes estaba
 * repartido entre «General» y «Avanzado». Arriba los números —precio de
 * venta, de compra, lo que deja cada unidad y el margen—; debajo qué es,
 * de quién se compra y cómo se vende.
 */

const DATE_LONG: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export function ProductProfilePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const branchId = useBranchId();
  const product = useProductQuery(id, branchId);
  const catalog = useProductsQuery(branchId);

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("products.title"), onClick: () => navigate("/productos") }, product.data?.name ?? t("products.profile.title")]} />
      </ShellHeaderSlot>

      <QueryBoundary
        query={product}
        loading={
          <div className="space-y-4" data-testid="product-loading">
            <Skeleton className="h-20 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        error={(error, retry) => (
          <EmptyState
            title={t("products.profile.notFound")}
            description={`${t("products.profile.notFoundHint")} ${describeError(error).description}`}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/productos")}>
                  <ArrowLeft /> {t("products.profile.back")}
                </Button>
                <Button onClick={retry}>{t("common.retry")}</Button>
              </div>
            }
          />
        )}
      >
        {(data) => <ProductProfile product={data} categories={catalog.data?.categories ?? []} branchId={branchId} />}
      </QueryBoundary>
    </div>
  );
}

function ProductProfile({ product, categories, branchId }: { product: CatalogProduct; categories: readonly ProductCategory[]; branchId: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatNumber, formatDate } = useLocale();
  const formatMoney = useMoney();
  const setActive = useSetProductsActive(branchId);
  const remove = useRemoveProduct();
  const [editing, setEditing] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  const margin = marginOf(product);
  const profit = profitOf(product);
  const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
  const notSet = t("products.profile.notSet");

  const toggleActive = React.useCallback(() => {
    const turningOn = !product.active;
    setActive.mutate(
      { productIds: [product.id], active: turningOn },
      {
        onSuccess: () => toast.success(t(turningOn ? "products.activated" : "products.deactivated", { count: 1 }), { description: t(turningOn ? "products.activatedHint" : "products.deactivatedHint") }),
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  }, [product.active, product.id, setActive, t]);

  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      product.active
        ? { id: "deactivate", label: t("products.action.deactivate"), icon: <PowerOff className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: toggleActive }
        : { id: "activate", label: t("products.action.activate"), icon: <Power className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: toggleActive },
      { id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["screen"], tone: "danger", overflow: true, onSelect: () => setConfirmRemove(true) },
      { id: "edit", label: t("action.edit"), icon: <Pencil className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setEditing(true) },
    ],
    [product.active, t, toggleActive]
  );

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ProductGlyph size="lg" />
            <span className="flex flex-wrap items-center gap-2">
              {product.name}
              <ProductActiveBadge active={product.active} />
              <SellableBadge sellable={product.sellable} />
            </span>
          </span>
        }
        description={[categoryName(categories, product.categoryId), product.brand, formatMoney(product.price)].filter(Boolean).join(" · ")}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/productos")}>
            <ArrowLeft /> {t("products.profile.back")}
          </Button>
        }
      />

      <div className="space-y-section">
        <section aria-label={t("products.profile.numbersAria")} className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t("products.column.price")} value={formatMoney(product.price)} caption={product.taxRate === null ? t("products.profile.noTax") : t("products.profile.plusTax", { rate: percent(product.taxRate) })} tone="brand" icon="chart" />
          <MetricCard label={t("products.column.cost")} value={product.cost === null ? "—" : formatMoney(product.cost)} caption={product.cost === null ? t("products.profile.costMissing") : t("products.profile.costCaption")} hint={t("products.profile.costHint")} tone="warning" icon="file" />
          <MetricCard label={t("products.profile.profit")} value={profit === null ? "—" : formatMoney(profit)} caption={profit === null ? t("products.profile.marginMissing") : t("products.profile.profitCaption")} tone="positive" icon="award" />
          <MetricCard label={t("products.column.margin")} value={margin === null ? "—" : percent(margin)} caption={margin === null ? t("products.profile.marginMissing") : t("products.profile.marginCaption")} hint={t("products.pulse.marginHint")} tone="brand" icon="chart" />
        </section>

        <div className="grid items-start gap-stack lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-stack">
            <InfoCard title={t("products.profile.about")}>
              <Text tone={product.description ? "default" : "muted"}>{product.description || t("products.profile.noDescription")}</Text>
            </InfoCard>
            <InfoCard title={t("products.profile.supply")} description={t("products.profile.supplyHint")}>
              <InfoRow icon={<Tag />} label={t("products.form.brand")}>
                {product.brand ?? notSet}
              </InfoRow>
              <InfoRow icon={<Truck />} label={t("products.form.distributor")}>
                {product.distributor ?? notSet}
              </InfoRow>
              <InfoRow icon={<Barcode />} label={t("products.form.sku")}>
                {product.sku ? <span className="font-mono text-xs">{product.sku}</span> : notSet}
              </InfoRow>
            </InfoCard>
          </div>

          <InfoCard title={t("products.profile.selling")}>
            <InfoRow icon={<FolderTree />} label={t("products.column.category")}>
              {categoryName(categories, product.categoryId)}
            </InfoRow>
            <InfoRow icon={<ShoppingBag />} label={t("products.form.sellable")}>
              {t(product.sellable ? "products.profile.sellableOn" : "products.profile.sellableOff")}
            </InfoRow>
            <InfoRow icon={<Globe />} label={t("products.form.public")}>
              <span className="flex flex-wrap items-center gap-2">
                <ProductVisibilityBadge visibility={product.visibility} />
                {t(product.visibility === "public" ? "products.profile.publicOn" : "products.profile.publicOff")}
              </span>
            </InfoRow>
            <InfoRow icon={<Percent />} label={t("products.form.tax")}>
              {product.taxRate === null ? t("products.profile.noTax") : percent(product.taxRate)}
            </InfoRow>
            <InfoRow icon={<CalendarClock />} label={t("products.profile.createdAt")}>
              {formatDate(new Date(product.createdAt), DATE_LONG)}
            </InfoRow>
          </InfoCard>
        </div>
      </div>

      <ShellRailSlot>
        <DataListActionRail actions={actions} selectedCount={0} onClearSelection={() => undefined} isBlocked={editing || confirmRemove} />
      </ShellRailSlot>

      <ProductFormDrawer open={editing} onOpenChange={setEditing} product={product} categories={categories} branchId={branchId} />

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        variant="destructive"
        title={t("products.remove.title", { name: product.name })}
        description={t("products.remove.hint")}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(product.id, {
            onSuccess: () => {
              toast.success(t("products.remove.done"), { description: product.name });
              navigate("/productos");
            },
            onError: (error) => {
              toast.error(describeError(error).title, { description: describeError(error).description });
              setConfirmRemove(false);
            },
          })
        }
      />
    </>
  );
}
