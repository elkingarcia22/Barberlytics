import * as React from "react";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { defaultBranchId, type BookingStep } from "../../bookingState";
import { useBookingFlow } from "../../flow/BookingContext";
import { AsideSlotProvider } from "../../flow/asideSlot";
import { BookingSummaryAside } from "../../flow/BookingSummaryAside";
import { BookingSheet } from "../../flow/BookingSheet";
import { HIDE_SCROLLBAR } from "../../flow/drawerFit";
import { ConfirmedStep } from "../../steps/ConfirmedStep";
import { GiftStep } from "../../steps/GiftStep";
import { ManageStep } from "../../steps/ManageStep";
import { PackagesStep } from "../../steps/PackagesStep";
import { WaitlistedStep } from "../../steps/WaitlistedStep";
import { defaultServiceId } from "./agendaModel";
import { AgendaBoard } from "./AgendaBoard";
import { AgendaCartBar } from "./AgendaCart";
import { AgendaHeader } from "./AgendaHeader";
import { AgendaIdentity } from "./AgendaIdentity";
import { AgendaSelectCheckout } from "./AgendaSelectCheckout";

interface AgendaFlowProps {
  headerTrailing?: React.ReactNode;
  onFinish?: () => void;
}

/** Pantallas que no son la agenda: el final, «Mis citas» y lo que se compra aparte. */
const OWN_SCREENS: ReadonlySet<BookingStep> = new Set(["confirmed", "waitlisted", "manage", "gift", "packages"]);

/**
 * Agenda con selector: la reserva que parte del «¿cuándo?». Se abre ya con horas
 * a la vista —para el servicio más pedido— sin pedir nada; sede, servicios y
 * barbero se cambian en campos que abren su lista, se aparta una hora con un
 * toque y solo al confirmar se pregunta quién es y cómo paga.
 */
export function AgendaFlow({ headerTrailing, onFinish }: AgendaFlowProps) {
  const t = useAppT();
  const { state, dispatch, shop, catalog, layout } = useBookingFlow();
  const [chosenView, setView] = React.useState<"board" | "checkout">("board");
  // Sin citas no hay nada que confirmar: se queda en la agenda.
  const view = state.items.length === 0 ? "board" : chosenView;
  const [signInOpen, setSignInOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const seededDraft = React.useRef<string | null>(null);
  const isWide = layout === "wide";
  const ownScreen = OWN_SCREENS.has(state.step);

  // La sede: la de siempre del cliente o la primera; se cambia junto al título.
  React.useEffect(() => {
    if (state.branchId || shop.branches.length === 0) return;
    dispatch({ type: "chooseBranch", branchId: defaultBranchId(state.customer, shop.branches.map((item) => item.id)) ?? shop.branches[0].id });
  }, [state.branchId, state.customer, shop.branches, dispatch]);

  // Siempre hay una cita en borrador: la agenda abre con el servicio más pedido para enseñar horas desde
  // el primer momento; tras apartar una hora, la siguiente sigue con lo mismo.
  React.useEffect(() => {
    if (!catalog || !state.branchId || ownScreen) return;
    if (!state.draft) {
      const last = state.items.at(-1);
      const fallback = defaultServiceId(catalog.services);
      // El barbero es una elección propia: la siguiente cita sigue con el mismo.
      dispatch({ type: "openDraft", person: { kind: "self" }, serviceIds: last ? last.serviceIds : fallback ? [fallback] : [], barberId: last?.barberId ?? null });
      return;
    }
    if (state.draft.serviceIds.length === 0 && state.items.length === 0 && seededDraft.current !== state.draft.key) {
      seededDraft.current = state.draft.key;
      const fallback = defaultServiceId(catalog.services);
      if (fallback) dispatch({ type: "toggleService", serviceId: fallback });
    }
  }, [catalog, state.branchId, state.draft, state.items, ownScreen, dispatch]);

  // Se reserva una cita: la hora que se toca después reemplaza a la anterior.
  const [actionSlot, setActionSlot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    if (state.items.length < 2) return;
    for (let extra = state.items.length - 1; extra > 0; extra -= 1) dispatch({ type: "removeItem", index: 0 });
  }, [state.items.length, dispatch]);

  // Al entrar desde la cabecera, la hoja se cierra sola: ya se sabe quién es.
  if (signInOpen && state.customer) setSignInOpen(false);

  // Cada vista empieza arriba; apartar horas en la agenda (que mueve el paso por dentro) no la mueve.
  const screen = ownScreen ? state.step : view;
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen]);

  const toBoard = () => {
    setView("board");
    // El embudo cuenta el resumen como el paso de antes de pagar.
    if (state.step === "payment") dispatch({ type: "goTo", step: "review" });
  };
  const toCheckout = () => {
    setView("checkout");
    dispatch({ type: "goTo", step: "payment" });
  };

  const back: (() => void) | null = ownScreen
    ? () => dispatch({ type: "goTo", step: state.step === "manage" && state.reservation ? "confirmed" : "services" })
    : view === "checkout"
      ? toBoard
      : null;

  const content =
    state.step === "confirmed" ? (
      <ConfirmedStep onFinish={onFinish} />
    ) : state.step === "waitlisted" ? (
      <WaitlistedStep onFinish={onFinish} />
    ) : state.step === "manage" ? (
      <ManageStep />
    ) : state.step === "gift" ? (
      <GiftStep />
    ) : state.step === "packages" ? (
      <PackagesStep />
    ) : view === "checkout" ? (
      <AgendaSelectCheckout />
    ) : (
      <AgendaBoard onNeedSignIn={() => setSignInOpen(true)} />
    );

  return (
    <>
      {/* «Tu reserva» ocupa todo el alto: la cabecera llega hasta el panel. */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <AgendaHeader onBack={state.step === "confirmed" || state.step === "waitlisted" ? null : back} onSignIn={() => setSignInOpen(true)} trailing={headerTrailing} showChat={!ownScreen && view === "board"} />
          <div ref={scrollRef} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", !isWide && HIDE_SCROLLBAR)}>
            <div className="flex min-h-full w-full flex-col">
              {/* Columna flexible: el pie de cada paso queda pegado abajo aunque el contenido sea corto. */}
              <div className="flex flex-1 flex-col">
                {/* En monitor, el botón de pagar va al pie de «Tu reserva»; sin panel, en la barra de abajo. */}
                <AsideSlotProvider value={isWide && !ownScreen && view === "checkout" ? actionSlot : null}>{content}</AsideSlotProvider>
              </div>
              {!isWide && !ownScreen && view === "board" && <AgendaCartBar onEdit={() => undefined} onContinue={toCheckout} />}
            </div>
          </div>
        </div>
        {isWide && !ownScreen && (
          <div className="w-96 shrink-0 overflow-hidden border-l border-border bg-surface/60">
            {/* El mismo resumen que Paso a paso. */}
            <BookingSummaryAside actionSlotRef={setActionSlot} draftUntilBooked atPayment={view === "checkout"} />
          </div>
        )}
        {/* En la agenda (sin pie propio), el botón de seguir va al pie del resumen. */}
        {isWide && !ownScreen && view === "board" && actionSlot &&
          createPortal(
            <Button type="button" size="lg" className="w-full" disabled={state.items.length === 0} onClick={toCheckout}>
              {t("booking.agenda.cart.continue")}
              <ThemaIcon name="arrowRight" />
            </Button>,
            actionSlot
          )}
      </div>
      <BookingSheet open={signInOpen} onOpenChange={setSignInOpen} title={t("booking.agenda.signInTitle")} description={t("booking.agenda.signInLead")}>
        <AgendaIdentity />
      </BookingSheet>
    </>
  );
}
