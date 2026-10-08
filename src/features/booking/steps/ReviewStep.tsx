import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Field, NumberField } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { personName } from "../bookingState";
import { parseStart } from "../bookingFormat";
import { renderPolicy } from "../pricing";
import { AppointmentCard } from "../flow/AppointmentCard";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";
import { itemDuration, itemPrice } from "../useBookingTotals";

const MAX_QTY = 9;

/**
 * El carrito: cada cita en su tarjeta (con cambiar y quitar), sumar otra
 * —para la misma persona otro día o para alguien que viene con ella—, lo que
 * se lleva de la tienda y una nota para el barbero. El total se ve siempre.
 */
export function ReviewStep() {
  const t = useAppT();
  const { state, dispatch, catalog, shop, fmt, totals, layout } = useBookingFlow();
  const products = catalog?.products ?? [];

  const remove = (index: number) => {
    const item = state.items[index];
    if (!item) return;
    dispatch({ type: "removeItem", index });
    toast(t("booking.review.removed"), { action: { label: t("booking.review.undo"), onClick: () => dispatch({ type: "restoreItem", index, item }) } });
  };

  if (state.items.length === 0) {
    return (
      <StepLayout title={t("booking.review.title")}>
        <EmptyState
          icon="calendar"
          title={t("booking.review.emptyTitle")}
          description={t("booking.review.emptyLead")}
          action={
            <Button type="button" onClick={() => dispatch({ type: "addAnother", person: { kind: "self" } })}>
              {t("booking.review.start")}
            </Button>
          }
        />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={t("booking.review.title")}
      lead={t("booking.review.lead")}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <Text size="xs" tone="muted">
              {t("booking.payment.total")}
            </Text>
            <Text size="lg" weight="semibold" tabular>
              {fmt.money(totals.total)}
            </Text>
          </div>
          <Button type="button" size="lg" onClick={() => dispatch({ type: "goTo", step: "payment" })}>
            {t("booking.review.continue")}
            <ThemaIcon name="arrowRight" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {state.items.map((item, index) => {
          const barber = catalog?.barbers.find((entry) => entry.id === item.barberId);
          const relation = item.person.kind === "self" ? null : item.person.relation;
          return (
            <AppointmentCard
              key={item.key}
              data={{
                personName: personName(item.person, state.customer),
                relation,
                services: item.serviceIds.map((id) => catalog?.services.find((service) => service.id === id)?.name ?? id),
                barberName: barber?.name ?? t("booking.review.noPreference"),
                barberAvatarUrl: barber?.avatarUrl,
                when: item.start ? fmt.when(parseStart(item.start)) : "",
                duration: t("booking.review.minutes", { count: itemDuration(item.serviceIds, catalog) }),
                price: fmt.money(itemPrice(item, catalog)),
              }}
              actions={
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: "editItem", index })}>
                    <ThemaIcon name="edit" />
                    {t("booking.review.edit")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label={t("booking.review.remove")}>
                    <ThemaIcon name="close" />
                    {layout === "wide" && t("booking.review.remove")}
                  </Button>
                </>
              }
            />
          );
        })}
        <MagicCard onClick={() => dispatch({ type: "addAnother", person: { kind: "self" } })} contentClassName="items-center gap-3 text-left">
          <IconTile size="md" icon={<ThemaIcon name="plus" />} />
          <span className="flex flex-col">
            <Text weight="semibold" as="span">
              {t("booking.review.addAnother")}
            </Text>
            <Text size="xs" tone="secondary" as="span">
              {t("booking.review.addAnotherHint")}
            </Text>
          </span>
        </MagicCard>
      </div>

      {products.length > 0 && (
        <section aria-labelledby="products-title" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <Heading level={5} id="products-title">
              {t("booking.review.productsTitle")}
            </Heading>
            <Text size="sm" tone="secondary">
              {t("booking.review.productsLead")}
            </Text>
          </div>
          <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
            {products.map((product) => {
              const qty = state.products[product.id] ?? 0;
              return (
                <div key={product.id} className={cn("flex w-40 shrink-0 snap-start flex-col gap-2 rounded-2xl border bg-surface p-3 transition-colors duration-fast", qty > 0 ? "border-primary" : "border-border")}>
                  <IconTile size="xl" src={product.imageUrl} icon={<ThemaIcon name="layers" />} />
                  <div className="flex min-h-10 flex-col">
                    <Text size="sm" weight="medium" className="line-clamp-2">
                      {product.name}
                    </Text>
                    <Text size="sm" tone="secondary" tabular>
                      {fmt.money(product.price)}
                    </Text>
                  </div>
                  {qty === 0 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "setProduct", productId: product.id, qty: 1 })}>
                      <ThemaIcon name="plus" />
                      {t("booking.review.add")}
                    </Button>
                  ) : (
                    <NumberField size="sm" stepper="sides" min={0} max={MAX_QTY} value={qty} onValueChange={(value) => dispatch({ type: "setProduct", productId: product.id, qty: value ?? 0 })} aria-label={product.name} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Field label={t("booking.review.notes")}>
        <Textarea value={state.notes} onChange={(event) => dispatch({ type: "setNotes", notes: event.target.value })} placeholder={t("booking.review.notesPlaceholder")} rows={2} />
      </Field>

      <Collapsible className="rounded-2xl border border-border bg-surface-subtle">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <ThemaIcon name="info" size="sm" />
              {t("booking.review.policy")}
            </span>
            <ThemaIcon name="chevronDown" size="sm" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <Text size="sm" tone="secondary" className="whitespace-pre-line">
            {renderPolicy(shop.policy, shop)}
          </Text>
        </CollapsibleContent>
      </Collapsible>
    </StepLayout>
  );
}
