import * as React from "react";
import { CreditCard, Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection, DrawerShell } from "@/components/overlays";
import { RadioCardGroup, SegmentedControl } from "@/components/selection";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { IconTile } from "@/components/utility";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import type { ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { useCreateSale } from "./queries";
import { PAYMENT_METHOD_KEYS, paymentMethodSchema, type PaymentMethod, type ProductLine } from "./types";

/**
 * Venta rápida de productos: para quien se lleva una cera sin tener cita.
 * Se eligen los productos por categoría, el total va sumando y «Pagar
 * orden» registra la venta.
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
  const [category, setCategory] = React.useState("all");
  const [items, setItems] = React.useState<ProductLine[]>([]);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");

  const categories = [...new Set(ctx.catalog.products.map((product) => product.category))];
  const products = ctx.catalog.products.filter((product) => category === "all" || product.category === category);
  const qtyOf = (productId: string) => items.find((line) => line.productId === productId)?.qty ?? 0;
  const change = (productId: string, delta: number) =>
    setItems((current) => {
      const qty = qtyOf(productId) + delta;
      if (qty <= 0) return current.filter((line) => line.productId !== productId);
      return current.some((line) => line.productId === productId) ? current.map((line) => (line.productId === productId ? { ...line, qty } : line)) : [...current, { productId, qty }];
    });
  const total = items.reduce((sum, line) => sum + (ctx.catalog.products.find((product) => product.id === line.productId)?.price ?? 0) * line.qty, 0);

  const pay = () => {
    sale.mutate(
      { branchId, items, method },
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
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("calendar.quickSale.title")}
      description={t("calendar.quickSale.hint")}
      footer={
        <div className="space-y-3 border-t border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <Text weight="semibold">{t("calendar.quickSale.total")}</Text>
            <Text weight="semibold" size="lg" tabular>
              {ctx.formatMoney(total)}
            </Text>
          </div>
          <Button className="w-full" onClick={pay} disabled={items.length === 0 || sale.isPending} data-testid="quick-sale-pay">
            <ShoppingBag /> {t("calendar.quickSale.pay")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3" data-testid="quick-sale-drawer">
        <DrawerSection icon={Package} tone="positive" title={t("calendar.checkout.products")} hint={t("calendar.quickSale.hint")} badge={String(items.reduce((sum, line) => sum + line.qty, 0))}>
          <div className="space-y-3">
            <SegmentedControl
              size="sm"
              variant="outline"
              ariaLabel={t("calendar.checkout.products")}
              options={[{ value: "all", label: t("calendar.quickSale.all") }, ...categories.map((item) => ({ value: item, label: item }))]}
              value={category}
              onChange={setCategory}
            />
            <ListItemGroup>
              {products.map((product) => {
                const qty = qtyOf(product.id);
                return (
                  <ListItem
                    key={product.id}
                    size="sm"
                    leading={<IconTile icon={<Package />} size="sm" tone={qty > 0 ? "positive" : "neutral"} />}
                    title={product.name}
                    description={product.category}
                    meta={ctx.formatMoney(product.price)}
                    selected={qty > 0}
                    actions={
                      <span className="flex items-center gap-1">
                        {qty > 0 && (
                          <>
                            <Button size="icon-xs" variant="outline" aria-label={`${t("calendar.checkout.remove")}: ${product.name}`} onClick={() => change(product.id, -1)}>
                              <Minus />
                            </Button>
                            <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                          </>
                        )}
                        <Button size="icon-xs" variant="outline" aria-label={`${t("calendar.checkout.addProduct")}: ${product.name}`} onClick={() => change(product.id, 1)}>
                          <Plus />
                        </Button>
                      </span>
                    }
                  />
                );
              })}
            </ListItemGroup>
            {items.length === 0 && <Text variant="muted">{t("calendar.quickSale.empty")}</Text>}
          </div>
        </DrawerSection>

        <DrawerSection icon={CreditCard} tone="neutral" title={t("calendar.checkout.method")} hint={t("calendar.checkout.methodHint")}>
          <RadioCardGroup columns={2} value={method} onChange={(value) => setMethod(value as PaymentMethod)} options={paymentMethodSchema.options.map((option) => ({ value: option, label: t(PAYMENT_METHOD_KEYS[option]) }))} />
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}
