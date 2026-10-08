import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { initialsOf, parseStart } from "../bookingFormat";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";
import { NextVisitSuggestion } from "../flow/NextVisitSuggestion";
import { useBookingCatalogQuery, useVisitSuggestionQuery } from "../queries";
import { itemDuration, itemPrice } from "../useBookingTotals";

/**
 * El cliente que vuelve: lo más probable es que quiera lo mismo de la última
 * vez, así que eso va primero y a un toque de la hora. Lo distinto queda a
 * la vista, no escondido.
 */
export function WelcomeStep() {
  const t = useAppT();
  const { state, dispatch, shop, fmt } = useBookingFlow();
  const customer = state.customer;
  const last = customer?.lastVisit ?? null;
  const branch = shop.branches.find((item) => item.id === last?.branchId);
  const { data: catalog, isLoading } = useBookingCatalogQuery(last?.branchId ?? null);
  const barber = catalog?.barbers.find((item) => item.id === last?.barberId);
  const services = (last?.serviceIds ?? []).map((id) => catalog?.services.find((item) => item.id === id)).filter((item) => item !== undefined);
  const canRepeat = last !== null && branch !== undefined && services.length > 0;
  const onlyBranchId = shop.branches.length === 1 ? shop.branches[0].id : null;
  // Con su frecuencia de visita se le propone ya el día y la hora que le tocan.
  const { data: suggestionData, isLoading: isSuggesting } = useVisitSuggestionQuery(customer?.id ?? null);
  const suggestion = suggestionData?.suggestion ?? null;
  const repeat = () => last && dispatch({ type: "repeatLastVisit", lastVisit: { ...last, serviceIds: services.map((item) => item.id), barberId: barber ? barber.id : null } });

  if (!customer) return null;

  return (
    <StepLayout title={t("booking.welcome.title", { name: customer.firstName })} lead={t("booking.welcome.lead")}>
      {customer.upcoming > 0 && (
        <Alert variant="info">
          <ThemaIcon name="calendar" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("booking.welcome.upcoming", { count: customer.upcoming })}</span>
            <Button type="button" variant="link" size="sm" onClick={() => dispatch({ type: "openManage" })}>
              {t("booking.welcome.upcomingAction")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {customer.credit > 0 && (
        <Alert variant="success">
          <ThemaIcon name="ticket" />
          <AlertDescription>{t("booking.welcome.credit", { amount: fmt.money(customer.credit) })}</AlertDescription>
        </Alert>
      )}

      {last && (
        <section aria-labelledby="repeat-title" className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" aria-hidden />
          <div className="relative flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <ThemaIcon name="refresh" size="sm" tone="primary" />
              <Heading level={5} id="repeat-title">
                {suggestion ? t("booking.suggest.title") : t("booking.welcome.repeatTitle")}
              </Heading>
            </div>
            {isLoading || isSuggesting ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center gap-3">
                      <IconTile size="lg" src={service.imageUrl} icon={<ThemaIcon name="scissors" />} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Text weight="semibold" truncate>
                          {service.name}
                        </Text>
                        <Text size="xs" tone="muted">
                          {t("booking.services.minutes", { count: service.durationMin })}
                        </Text>
                      </div>
                    </div>
                  ))}
                  {barber && (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-subtle p-3">
                      <Avatar>
                        {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
                        <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Text size="xs" tone="muted">
                          {t("booking.barber.lastTime")}
                        </Text>
                        <Text size="sm" weight="medium" truncate>
                          {barber.name}
                          {barber.level ? ` · ${barber.level}` : ""}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <Text size="xs" tone="muted">
                    {branch ? t("booking.welcome.repeatLead", { date: fmt.day(parseStart(last.at)), branch: branch.name }) : ""}
                  </Text>
                  <Text size="lg" weight="semibold" tabular className="shrink-0">
                    {fmt.money(itemPrice({ serviceIds: last.serviceIds, barberId: last.barberId }, catalog))}
                    <Text as="span" size="sm" tone="muted" weight="normal">
                      {" · "}
                      {t("booking.review.minutes", { count: itemDuration(last.serviceIds, catalog) })}
                    </Text>
                  </Text>
                </div>
                {suggestion ? (
                  <NextVisitSuggestion suggestion={suggestion} catalog={catalog} onPickOther={repeat} />
                ) : (
                  <Button type="button" size="lg" className="w-full" disabled={!canRepeat} onClick={repeat}>
                    {t("booking.welcome.repeat")}
                    <ThemaIcon name="arrowRight" />
                  </Button>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => dispatch({ type: "startFresh", onlyBranchId })}>
        <ThemaIcon name="plus" />
        {t("booking.welcome.different")}
      </Button>

      <Button type="button" variant="link" size="sm" className="self-center" onClick={() => dispatch({ type: "restart" })}>
        {t("booking.welcome.notYou")}
      </Button>
    </StepLayout>
  );
}
