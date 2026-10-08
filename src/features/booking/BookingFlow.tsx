import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Grain, Halo } from "@/components/atmosphere";
import { ErrorState } from "@/lib/query";
import { PortalContainerProvider } from "@/components/ui/portal-container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { bookingReducer, initialBookingState, type BookingAction, type BookingState } from "./bookingState";
import { useBookingFormat } from "./bookingFormat";
import { BookingFlowProvider, type BookingFlowValue, type BookingLayout } from "./flow/BookingContext";
import { BookingHeader } from "./flow/BookingHeader";
import { BookingSummaryAside } from "./flow/BookingSummaryAside";
import { useBookingCatalogQuery, useBookingShopQuery } from "./queries";
import { BarberStep } from "./steps/BarberStep";
import { BlockedStep } from "./steps/BlockedStep";
import { BranchStep } from "./steps/BranchStep";
import { ConfirmedStep } from "./steps/ConfirmedStep";
import { ManageStep } from "./steps/ManageStep";
import { PaymentStep } from "./steps/PaymentStep";
import { PhoneStep } from "./steps/PhoneStep";
import { ProfileStep } from "./steps/ProfileStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ServicesStep } from "./steps/ServicesStep";
import { TimeStep } from "./steps/TimeStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { useBookingTotals } from "./useBookingTotals";
import type { BookingShop } from "./types";

export interface BookingFlowProps {
  layout?: BookingLayout;
  touch?: "default" | "lg";
  /** Lo que va en la esquina de la cabecera (el cierre del widget). */
  headerTrailing?: React.ReactNode;
  /** El widget se cierra al terminar; la página completa no. */
  onFinish?: () => void;
  className?: string;
}

/** A dónde lleva «Atrás» desde cada paso; `null` = no hay atrás. */
function backAction(state: BookingState, shop: BookingShop): BookingAction | null {
  const identity: BookingAction = state.customer && !state.customer.isNew ? { type: "goTo", step: "welcome" } : { type: "restart" };
  switch (state.step) {
    case "profile":
    case "welcome":
    case "blocked":
      return { type: "restart" };
    case "branch":
      return state.items.length > 0 ? { type: "goTo", step: "review" } : identity;
    case "services":
      if (state.items.length > 0) return { type: "discardDraft" };
      return shop.branches.length > 1 ? { type: "goTo", step: "branch" } : identity;
    case "barber":
      return { type: "goTo", step: "services" };
    case "time":
      return { type: "goTo", step: "barber" };
    case "review":
      return { type: "addAnother", person: { kind: "self" } };
    case "payment":
      return { type: "goTo", step: "review" };
    case "manage":
      return state.reservation ? { type: "goTo", step: "confirmed" } : state.customer ? identity : { type: "restart" };
    default:
      return null;
  }
}

function StepSwitch({ state, onFinish }: { state: BookingState; onFinish?: () => void }) {
  switch (state.step) {
    case "phone":
      return <PhoneStep />;
    case "profile":
      return <ProfileStep />;
    case "welcome":
      return <WelcomeStep />;
    case "blocked":
      return <BlockedStep />;
    case "branch":
      return <BranchStep />;
    case "services":
      return <ServicesStep />;
    case "barber":
      return <BarberStep />;
    case "time":
      return <TimeStep />;
    case "review":
      return <ReviewStep />;
    case "payment":
      return <PaymentStep />;
    case "confirmed":
      return <ConfirmedStep onFinish={onFinish} />;
    case "manage":
      return <ManageStep />;
  }
}

/**
 * La reserva en línea entera, lista para montarse donde haga falta: a
 * pantalla completa en una tablet del local o un monitor, o dentro del
 * panel flotante del widget en el sitio de la barbería. Se adapta al sitio
 * que le dan (`layout`), no al ancho de la ventana.
 */
export function BookingFlow({ layout = "compact", touch = "default", headerTrailing, onFinish, className }: BookingFlowProps) {
  const t = useAppT();
  const shopQuery = useBookingShopQuery();
  const [state, dispatch] = React.useReducer(bookingReducer, undefined, () => initialBookingState());
  const [token, setToken] = React.useState<string | null>(null);
  const shop = shopQuery.data;
  const catalogQuery = useBookingCatalogQuery(state.branchId);
  const totals = useBookingTotals(state, catalogQuery.data, shop);
  const fmt = useBookingFormat(shop?.currency);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Las ventanas (drawers, modales) se abren dentro de la reserva, no en la
  // ventana: en el marco del celular o en el panel del widget no se salen.
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  // La propina por defecto de la barbería, una vez que se sabe cuál es.
  const defaultTip = shop?.defaultTipId ?? null;
  const tipSeeded = React.useRef(false);
  React.useEffect(() => {
    if (tipSeeded.current || defaultTip === null) return;
    tipSeeded.current = true;
    dispatch({ type: "setTip", tipId: defaultTip });
  }, [defaultTip]);

  // Cada paso empieza arriba.
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [state.step]);

  const value = React.useMemo<BookingFlowValue | null>(
    () => (shop ? { state, dispatch, shop, catalog: catalogQuery.data, catalogLoading: catalogQuery.isLoading, totals, fmt, layout, touch, token, setToken } : null),
    [shop, state, catalogQuery.data, catalogQuery.isLoading, totals, fmt, layout, touch, token]
  );

  if (shopQuery.isError) {
    return (
      <div className={cn("flex h-full items-center justify-center p-6", className)}>
        <ErrorState error={shopQuery.error} onRetry={() => void shopQuery.refetch()} />
      </div>
    );
  }
  if (!value) {
    return (
      <div className={cn("flex h-full flex-col gap-4 p-6", className)} aria-busy>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const back = backAction(state, value.shop);
  const showAside = layout === "wide" && ["branch", "services", "barber", "time", "review", "payment"].includes(state.step);

  return (
    <BookingFlowProvider value={value}>
      <PortalContainerProvider value={portalRoot}>
      {/* `translateZ(0)` hace de esta sección el bloque contenedor de lo `fixed`: las ventanas se miden contra ella. */}
      <section ref={setPortalRoot} aria-label={t("booking.phone.title")} className={cn("relative isolate flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground [transform:translateZ(0)]", className)}>
        <Halo x="85%" y="0%" size="60% 40%" strength={0.12} />
        <Grain scope="container" />
        <BookingHeader onBack={back ? () => dispatch(back) : null} trailing={headerTrailing} />
        <div className="flex min-h-0 flex-1">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className={cn("mx-auto flex min-h-full w-full flex-col", layout === "wide" ? "max-w-3xl" : "max-w-xl")}>
              <StepSwitch state={state} onFinish={onFinish} />
            </div>
          </div>
          {showAside && (
            <div className="hidden w-96 shrink-0 overflow-y-auto border-l border-border bg-surface/60 lg:block">
              <BookingSummaryAside />
            </div>
          )}
        </div>
      </section>
      </PortalContainerProvider>
    </BookingFlowProvider>
  );
}
