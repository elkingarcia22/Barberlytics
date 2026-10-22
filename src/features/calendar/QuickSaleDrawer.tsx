import * as React from "react";
import { Banknote, Building2, Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { SelectableRow } from "@/components/selection";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Chip } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { Field, NumberField } from "@/components/forms";
import { useAccess } from "@/features/access";
import { useCurrencyInput } from "@/features/branches";
import type { ModelContext } from "./calendarModel";
import { changeDue, appointmentBill } from "./checkoutMath";
import { useOpenKey } from "./calendarFormat";
import { useCreateSale } from "./queries";
import { PAYMENT_METHOD_KEYS, paymentMethodSchema, type PaymentMethod, type ProductLine } from "./types";
import { PersonAvatar, ProductThumb } from "./calendarShared";
import { InlineList, PanelField, PanelQuestion } from "./appointmentPanel/bookingStyle";
import { SearchBox } from "./createAppointment/SearchBox";
import { FieldIcon, SaleCard, SaleCardHead } from "./saleParts";

const NO_SELLER = "__barberia";

type SaleField = "products" | "seller" | "method";

/**
 * Venta de producto: para quien se lleva una cera sin tener cita. Con la cara de «Crear cita»: la
 * tarjeta con el total arriba y tres preguntas —qué se lleva, quién lo vende y cómo paga—, cada una
 * un campo que abre su lista en su sitio; al final, un solo botón que dice cuánto se cobra.
 */

export interface QuickSaleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  ctx: ModelContext;
}

export function QuickSaleDrawer(props: QuickSaleDrawerProps) {
  return <QuickSalePanel key={useOpenKey(props.open)} {...props} />;
}

function QuickSalePanel({ open, onOpenChange, branchId, ctx }: QuickSaleDrawerProps) {
  const t = useAppT();
  const sale = useCreateSale();
  // Arranca en los productos: es lo único que no tiene valor de entrada.
  const [openField, setOpenField] = React.useState<SaleField | null>("products");
  const [items, setItems] = React.useState<ProductLine[]>([]);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  // Quién vendió (comisiona en su nómina). El barbero vende a su nombre: el servidor lo pone solo.
  const access = useAccess();
  const [sellerId, setSellerId] = React.useState<string>(NO_SELLER);
  const [received, setReceived] = React.useState<number | null>(null);
  const toggle = (field: SaleField) => setOpenField((current) => (current === field ? null : field));

  const qtyOf = (productId: string) => items.find((line) => line.productId === productId)?.qty ?? 0;
  const changeQty = (productId: string, delta: number) =>
    setItems((current) => {
      const qty = qtyOf(productId) + delta;
      if (qty <= 0) return current.filter((line) => line.productId !== productId);
      return current.some((line) => line.productId === productId) ? current.map((line) => (line.productId === productId ? { ...line, qty } : line)) : [...current, { productId, qty }];
    });
  // Con el impuesto de la sucursal, igual que lo cobra el servidor.
  const { tax, total } = appointmentBill(ctx.catalog, [], items);
  const count = items.reduce((sum, line) => sum + line.qty, 0);
  const change = method === "cash" ? changeDue(received, total) : null;
  const seller = ctx.catalog.barbers.find((barber) => barber.id === sellerId);
  const names = items.map((line) => {
    const product = ctx.catalog.products.find((item) => item.id === line.productId);
    return product ? (line.qty > 1 ? `${product.name} ×${line.qty}` : product.name) : "";
  });

  const pay = () => {
    sale.mutate(
      { branchId, items, method, sellerId: sellerId === NO_SELLER ? null : sellerId },
      {
        onSuccess: (created) => {
          toast.success(t("calendar.quickSale.paid"), { description: t("calendar.checkout.paidHint", { total: ctx.formatMoney(created.total), method: t(PAYMENT_METHOD_KEYS[method]) }) });
          onOpenChange(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.quickSale.title")}>
      <div data-testid="quick-sale-drawer">
        <SaleCard testId="quick-sale-cards">
          <SaleCardHead
            eyebrow={t("calendar.quickSale.title")}
            title={count > 0 ? ctx.formatMoney(total) : t("calendar.productSale.noItems")}
            lead={count > 0 ? t("calendar.productSale.summary", { count, method: t(PAYMENT_METHOD_KEYS[method]) }) : t("calendar.productSale.lead")}
          />

          <PanelQuestion title={t("calendar.productSale.what")}>
            <PanelField
              eyebrow={t("calendar.checkout.products")}
              value={names.join(" + ")}
              placeholder={t("calendar.productSale.pickProducts")}
              detail={count > 0 ? `${t("calendar.productSale.count", { count })} · ${ctx.formatMoney(total)}` : undefined}
              leading={<FieldIcon icon={Package} filled={count > 0} />}
              open={openField === "products"}
              onOpen={() => toggle("products")}
              testId="quick-sale-field-products"
            />
            {openField === "products" && <ProductList ctx={ctx} qtyOf={qtyOf} changeQty={changeQty} count={count} total={total} onClose={() => setOpenField(null)} onDone={() => setOpenField(null)} />}
          </PanelQuestion>

          {!access.isBarber && (
            <PanelQuestion title={t("calendar.productSale.who")}>
              <PanelField
                eyebrow={t("calendar.quickSale.seller")}
                value={seller?.name ?? t("calendar.quickSale.noSeller")}
                detail={t("calendar.quickSale.sellerHint")}
                leading={seller ? <PersonAvatar name={seller.name} avatarUrl={seller.avatarUrl} /> : <FieldIcon icon={Building2} filled />}
                open={openField === "seller"}
                onOpen={() => toggle("seller")}
                testId="quick-sale-seller"
              />
              {openField === "seller" && (
                <InlineList title={t("calendar.quickSale.seller")} description={t("calendar.quickSale.sellerHint")} onClose={() => setOpenField(null)}>
                  <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("calendar.quickSale.seller")}>
                    {[{ id: NO_SELLER, name: t("calendar.quickSale.noSeller"), avatarUrl: null as string | null | undefined }, ...ctx.catalog.barbers].map((person) => (
                      <SelectableRow
                        key={person.id}
                        role="radio"
                        checked={person.id === sellerId}
                        label={person.name}
                        leading={person.id === NO_SELLER ? <FieldIcon icon={Building2} filled /> : <PersonAvatar name={person.name} avatarUrl={person.avatarUrl} />}
                        onClick={() => {
                          setSellerId(person.id);
                          setOpenField(null);
                        }}
                      >
                        <Text as="span" weight="medium">
                          {person.name}
                        </Text>
                      </SelectableRow>
                    ))}
                  </div>
                </InlineList>
              )}
            </PanelQuestion>
          )}

          <PanelQuestion title={t("calendar.productSale.how")}>
            <PanelField
              eyebrow={t("calendar.checkout.method")}
              value={t(PAYMENT_METHOD_KEYS[method])}
              detail={method === "cash" && change !== null && change >= 0 && count > 0 ? t("calendar.checkout.changeHint", { amount: ctx.formatMoney(change) }) : undefined}
              leading={<FieldIcon icon={Banknote} filled />}
              open={openField === "method"}
              onOpen={() => toggle("method")}
              testId="quick-sale-field-method"
            />
            {openField === "method" && (
              <InlineList title={t("calendar.checkout.method")} description={t("calendar.checkout.methodHint")} onClose={() => setOpenField(null)}>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("calendar.checkout.method")}>
                  {paymentMethodSchema.options.map((option) => (
                    <SelectableRow
                      key={option}
                      role="radio"
                      checked={option === method}
                      label={t(PAYMENT_METHOD_KEYS[option])}
                      onClick={() => {
                        setMethod(option);
                        if (option !== "cash") setOpenField(null);
                      }}
                    >
                      <Text as="span" weight="medium">
                        {t(PAYMENT_METHOD_KEYS[option])}
                      </Text>
                    </SelectableRow>
                  ))}
                </div>
              </InlineList>
            )}
            {method === "cash" && count > 0 && <CashReceived ctx={ctx} received={received} onReceived={setReceived} change={change} />}
          </PanelQuestion>

          <PanelFooter>
            {tax > 0 && (
              <div className="flex items-center justify-between">
                <Text size="sm" tone="muted">
                  {t(ctx.catalog.taxInclusive ? "calendar.checkout.taxIncluded" : "calendar.checkout.tax")}
                </Text>
                <Text size="sm" tabular>
                  {ctx.formatMoney(tax)}
                </Text>
              </div>
            )}
            <Button size="lg" className="w-full" onClick={pay} disabled={count === 0 || sale.isPending} data-testid="quick-sale-pay">
              {count > 0 && <ShoppingBag />}
              {count > 0 ? t("calendar.productSale.payAmount", { amount: ctx.formatMoney(total) }) : t("calendar.productSale.missing")}
            </Button>
          </PanelFooter>
        </SaleCard>
      </div>
    </SidePanelShell>
  );
}

/** Los productos por categoría, con su buscador y + / − en cada uno; el pie cuenta y suma. */
function ProductList({ ctx, qtyOf, changeQty, count, total, onClose, onDone }: { ctx: ModelContext; qtyOf: (id: string) => number; changeQty: (id: string, delta: number) => void; count: number; total: number; onClose: () => void; onDone: () => void }) {
  const t = useAppT();
  const [category, setCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const categories = [...new Set(ctx.catalog.products.map((product) => product.category))];
  const needle = search.trim().toLowerCase();
  const products = ctx.catalog.products.filter((product) => (category === "all" || product.category === category) && (needle === "" || product.name.toLowerCase().includes(needle)));
  return (
    <InlineList
      title={t("calendar.checkout.products")}
      description={t("calendar.productSale.productsHint")}
      onClose={onClose}
      footer={
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <Text size="xs" tone="muted">
              {t("calendar.productSale.count", { count })}
            </Text>
            <Text weight="semibold" tabular>
              {ctx.formatMoney(total)}
            </Text>
          </span>
          <Button onClick={onDone} disabled={count === 0} data-testid="quick-sale-products-done">
            {t("calendar.createV.done")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder={t("calendar.quickSale.search")} autoFocus testId="quick-sale-search" />
        <div role="group" aria-label={t("calendar.checkout.products")} className="flex flex-wrap gap-1.5">
          {[{ value: "all", label: t("calendar.quickSale.all") }, ...categories.map((item) => ({ value: item, label: item }))].map((option) => (
            <Chip key={option.value} size="sm" label={option.label} selected={category === option.value} tone={category === option.value ? "primary" : "default"} onClick={() => setCategory(option.value)} />
          ))}
        </div>
        {products.length === 0 ? (
          <Text size="sm" tone="muted" className="px-1 py-2">
            {t("calendar.panel.client.noMatch", { query: search.trim() })}
          </Text>
        ) : (
          <ListItemGroup>
            {products.map((product) => {
              const qty = qtyOf(product.id);
              return (
                <ListItem
                  key={product.id}
                  size="sm"
                  leading={<ProductThumb product={product} tone={qty > 0 ? "positive" : "neutral"} />}
                  title={product.name}
                  description={`${product.category} · ${ctx.formatMoney(product.price)}`}
                  selected={qty > 0}
                  actions={
                    <span className="flex items-center gap-1">
                      {qty > 0 && (
                        <>
                          <Button size="icon-xs" variant="outline" aria-label={`${t("calendar.checkout.remove")}: ${product.name}`} onClick={() => changeQty(product.id, -1)}>
                            <Minus />
                          </Button>
                          <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                        </>
                      )}
                      <Button size="icon-xs" variant="outline" aria-label={`${t("calendar.checkout.addProduct")}: ${product.name}`} onClick={() => changeQty(product.id, 1)}>
                        <Plus />
                      </Button>
                    </span>
                  }
                />
              );
            })}
          </ListItemGroup>
        )}
      </div>
    </InlineList>
  );
}

/** En efectivo: cuánto entrega y el cambio (o lo que falta). */
function CashReceived({ ctx, received, onReceived, change }: { ctx: ModelContext; received: number | null; onReceived: (value: number | null) => void; change: number | null }) {
  const t = useAppT();
  const { symbol } = useCurrencyInput();
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-input bg-surface px-3 py-2.5">
      <Field label={t("calendar.checkout.received")}>
        <NumberField value={received} onValueChange={onReceived} min={0} step={1} prefix={symbol} size="sm" />
      </Field>
      {change !== null && (
        <Text size="sm" tone={change < 0 ? "negative" : "muted"} data-testid="quick-sale-change">
          {change < 0 ? t("calendar.checkout.missing", { amount: ctx.formatMoney(-change) }) : t("calendar.checkout.changeHint", { amount: ctx.formatMoney(change) })}
        </Text>
      )}
    </div>
  );
}
