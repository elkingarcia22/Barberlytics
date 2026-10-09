import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Grain, Halo } from "@/components/atmosphere";
import { ErrorState } from "@/lib/query";
import { PortalContainerProvider } from "@/components/ui/portal-container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { defaultBranchId, type BookingAction, type BookingState } from "./bookingState";
import { BookingFlowProvider, useBookingFlow, type BookingLayout } from "./flow/BookingContext";
import { BookingHeader } from "./flow/BookingHeader";
import { BookingSummaryAside } from "./flow/BookingSummaryAside";
import { BarberStep } from "./steps/BarberStep";
import { BlockedStep } from "./steps/BlockedStep";
import { BranchStep } from "./steps/BranchStep";
import { ConfirmedStep } from "./steps/ConfirmedStep";
import { ManageStep } from "./steps/ManageStep";
import { PaymentStep } from "./steps/PaymentStep";
import { PhoneStep } from "./steps/PhoneStep";
import { VerifyStep } from "./steps/VerifyStep";
import type { BookingSurface } from "./funnel";
import { PackagesStep } from "./steps/PackagesStep";
import { GiftStep } from "./steps/GiftStep";
import { ProfileStep } from "./steps/ProfileStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ServicesStep } from "./steps/ServicesStep";
import { TimeStep } from "./steps/TimeStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import type { BookingShop } from "./types";
import { useBookingEngine } from "./useBookingEngine";
import { AgendaFlow } from "./variants/agenda/AgendaFlow";
import { ChatFlow } from "./variants/chat/ChatFlow";
import { WelcomeLab, type WelcomeProposal } from "./variants/welcome-lab/WelcomeLab";
import type { BookingVersion } from "./versions";

export interface BookingFlowProps {
  /** Qué experiencia se monta; por defecto, la guiada. */
  version?: BookingVersion;
  layout?: BookingLayout;
  touch?: "default" | "lg";
  /** Lo que va en la esquina de la cabecera (el cierre del widget). */
  headerTrailing?: React.ReactNode;
  /** El widget se cierra al terminar; la página completa no. */
  onFinish?: () => void;
  /** Dónde se abre, para el embudo: la vista previa del panel no cuenta. */
  surface?: BookingSurface;
  className?: string;
}

/** A dónde lleva «Atrás» desde cada paso; `null` = no hay atrás. */
function backAction(state: BookingState, shop: BookingShop): BookingAction | null {
  const identity: BookingAction = state.customer && !state.customer.isNew ? { type: "goTo", step: "welcome" } : { type: "restart" };
  switch (state.step) {
    case "verify":
      return { type: "goTo", step: "phone" };
    case "gift":
    case "packages":
      return { type: "goTo", step: "welcome" };
    case "profile":
    case "welcome":
    case "blocked":
      return { type: "restart" };
    case "branch":
      // La sede es el paso 1: antes de ella solo está el inicio. Cambiar de sede desde el resumen
      // va por su propia hoja, así que aquí nunca se vuelve al resumen (era el salto del paso 1 al 5).
      return identity;
    case "services":
      // Vino del resumen a sumar o cambiar una cita: «Atrás» la descarta y vuelve allí.
      if (state.fromReview) return { type: "discardDraft" };
      // Con la sede ya dada (única, o la de siempre del cliente) no hay paso de sede al que volver.
      return defaultBranchId(state.customer, shop.branches.map((branch) => branch.id)) === null ? { type: "goTo", step: "branch" } : identity;
    case "barber":
      return { type: "goTo", step: "services" };
    case "time":
      return { type: "goTo", step: "barber" };
    case "review":
      // Atrás es hacia atrás en el flujo: la última cita, en su hora, para retocarla.
      return state.items.length > 0 ? { type: "reopenLast" } : { type: "addAnother", person: { kind: "self" } };
    case "payment":
      return { type: "goTo", step: "review" };
    case "manage":
      return state.reservation ? { type: "goTo", step: "confirmed" } : state.customer ? identity : { type: "restart" };
    default:
      return null;
  }
}

/** El laboratorio de la bienvenida: qué propuesta se ve. Vive en el flujo para no perderla al volver atrás. */
interface WelcomeLabSlot {
  proposal: WelcomeProposal;
  onProposalChange: (proposal: WelcomeProposal) => void;
}

function StepSwitch({ state, onFinish, welcomeLab }: { state: BookingState; onFinish?: () => void; welcomeLab?: WelcomeLabSlot }) {
  switch (state.step) {
    case "phone":
      return <PhoneStep />;
    case "verify":
      return <VerifyStep />;
    case "gift":
      return <GiftStep />;
    case "packages":
      return <PackagesStep />;
    case "profile":
      return <ProfileStep />;
    case "welcome":
      return welcomeLab ? <WelcomeLab {...welcomeLab} /> : <WelcomeStep />;
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

/** Paso a paso: la cabecera con el progreso, un paso por pantalla y, en monitor, el resumen al lado. */
function GuidedFlow({ headerTrailing, onFinish, welcomeLab = false }: Pick<BookingFlowProps, "headerTrailing" | "onFinish"> & { welcomeLab?: boolean }) {
  const { state, dispatch, shop, layout } = useBookingFlow();
  const [proposal, setProposal] = React.useState<WelcomeProposal>("pass");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Cada paso empieza arriba.
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [state.step]);

  const back = backAction(state, shop);
  const showAside = layout === "wide" && ["branch", "services", "barber", "time", "review", "payment"].includes(state.step);

  return (
    <>
      {/* El inicio no lleva cabecera: la marca ya está en su tarjeta. El widget la conserva por su botón de cerrar. */}
      {(state.step !== "phone" || headerTrailing) && <BookingHeader onBack={back ? () => dispatch(back) : null} trailing={headerTrailing} />}
      <div className="flex min-h-0 flex-1">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full w-full flex-col">
            <StepSwitch state={state} onFinish={onFinish} welcomeLab={welcomeLab ? { proposal, onProposalChange: setProposal } : undefined} />
          </div>
        </div>
        {showAside && (
          <div className="hidden w-96 shrink-0 overflow-y-auto border-l border-border bg-surface/60 lg:block">
            <BookingSummaryAside />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * La reserva en línea entera, lista para montarse donde haga falta: a
 * pantalla completa en una tablet del local o un monitor, o dentro del
 * panel flotante del widget en el sitio de la barbería. Se adapta al sitio
 * que le dan (`layout`), no al ancho de la ventana.
 *
 * Las tres versiones comparten el motor (`useBookingEngine`): los datos de la
 * barbería, el estado de la reserva, las cuentas y el cobro. Lo que cambia es
 * el recorrido.
 */
export function BookingFlow({ version = "guided", layout = "compact", touch = "default", headerTrailing, onFinish, surface = "preview", className }: BookingFlowProps) {
  const t = useAppT();
  const engine = useBookingEngine({ layout, touch, surface });
  // Las ventanas (drawers, modales) se abren dentro de la reserva, no en la
  // ventana: en el marco del celular o en el panel del widget no se salen.
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  if (engine.shopQuery.isError) {
    return (
      <div className={cn("flex h-full items-center justify-center p-6", className)}>
        <ErrorState error={engine.shopQuery.error} onRetry={() => void engine.shopQuery.refetch()} />
      </div>
    );
  }
  if (!engine.value) {
    return (
      <div className={cn("flex h-full flex-col gap-4 p-6", className)} aria-busy>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <BookingFlowProvider value={engine.value}>
      <PortalContainerProvider value={portalRoot}>
        {/* `translateZ(0)` hace de esta sección el bloque contenedor de lo `fixed`: las ventanas se miden contra ella. */}
        <section
          ref={setPortalRoot}
          aria-label={t("booking.phone.title")}
          data-version={version}
          className={cn("relative isolate flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground [transform:translateZ(0)]", className)}
        >
          <Halo x="85%" y="0%" size="60% 40%" strength={0.12} />
          <Grain scope="container" />
          {version === "agenda" || version === "agenda-select" ? (
            <AgendaFlow headerTrailing={headerTrailing} onFinish={onFinish} servicePicker={version === "agenda-select" ? "modal" : "chips"} />
          ) : version === "chat" ? (
            <ChatFlow headerTrailing={headerTrailing} onFinish={onFinish} />
          ) : (
            <GuidedFlow headerTrailing={headerTrailing} onFinish={onFinish} welcomeLab={version === "welcome-lab"} />
          )}
        </section>
      </PortalContainerProvider>
    </BookingFlowProvider>
  );
}
