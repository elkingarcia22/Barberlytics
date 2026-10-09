import * as React from "react";
import { useAppT } from "@/app/i18n";
import { defaultBranchId, type BookingStep } from "../../bookingState";
import { useBookingFlow } from "../../flow/BookingContext";
import { BookingSheet } from "../../flow/BookingSheet";
import { ConfirmedStep } from "../../steps/ConfirmedStep";
import { GiftStep } from "../../steps/GiftStep";
import { ManageStep } from "../../steps/ManageStep";
import { PackagesStep } from "../../steps/PackagesStep";
import { defaultServiceId } from "./agendaModel";
import { AgendaBoard, type ServicePickerMode } from "./AgendaBoard";
import { AgendaCartAside, AgendaCartBar, AgendaCartLines } from "./AgendaCart";
import { AgendaCheckout } from "./AgendaCheckout";
import { AgendaHeader } from "./AgendaHeader";
import { AgendaIdentity } from "./AgendaIdentity";
import { AgendaSelectCheckout } from "./AgendaSelectCheckout";

interface AgendaFlowProps {
  headerTrailing?: React.ReactNode;
  onFinish?: () => void;
  /** Cómo se elige qué se va a hacer: tira de chips (Agenda abierta) o campo con modal (Agenda con selector). */
  servicePicker?: ServicePickerMode;
}

/** Pantallas que no son la agenda: el final, «Mis citas» y lo que se compra aparte. */
const OWN_SCREENS: ReadonlySet<BookingStep> = new Set(["confirmed", "manage", "gift", "packages"]);

/**
 * Agenda abierta: la reserva que parte del «¿cuándo?». Se abre ya con horas a
 * la vista —de todos los barberos, para el servicio más pedido— sin pedir nada;
 * se apartan horas con un toque (para uno o para varios) y solo al confirmar se
 * pregunta quién es y cómo paga. Pensada para quien quiere ir hoy o mañana y
 * para el monitor del local, donde se ve el día entero de un vistazo.
 */
export function AgendaFlow({ headerTrailing, onFinish, servicePicker = "chips" }: AgendaFlowProps) {
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
      // En la Agenda con selector el barbero es una elección propia: la siguiente cita sigue con el mismo.
      dispatch({ type: "openDraft", person: { kind: "self" }, serviceIds: last ? last.serviceIds : fallback ? [fallback] : [], barberId: servicePicker === "modal" ? (last?.barberId ?? null) : null });
      return;
    }
    if (state.draft.serviceIds.length === 0 && state.items.length === 0 && seededDraft.current !== state.draft.key) {
      seededDraft.current = state.draft.key;
      const fallback = defaultServiceId(catalog.services);
      if (fallback) dispatch({ type: "toggleService", serviceId: fallback });
    }
  }, [catalog, state.branchId, state.draft, state.items, ownScreen, dispatch, servicePicker]);

  // En la Agenda con selector se reserva una cita: la hora que se toca después reemplaza a la anterior.
  const isSelect = servicePicker === "modal";
  React.useEffect(() => {
    if (!isSelect || state.items.length < 2) return;
    for (let extra = state.items.length - 1; extra > 0; extra -= 1) dispatch({ type: "removeItem", index: 0 });
  }, [isSelect, state.items.length, dispatch]);

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
    ) : state.step === "manage" ? (
      <ManageStep />
    ) : state.step === "gift" ? (
      <GiftStep />
    ) : state.step === "packages" ? (
      <PackagesStep />
    ) : view === "checkout" && isSelect ? (
      <AgendaSelectCheckout />
    ) : view === "checkout" ? (
      <AgendaCheckout onBack={toBoard} showAppointments={isWide ? null : <AgendaCartLines onEdit={toBoard} />} />
    ) : (
      <AgendaBoard onNeedSignIn={() => setSignInOpen(true)} servicePicker={servicePicker} />
    );

  return (
    <>
      <AgendaHeader onBack={state.step === "confirmed" ? null : back} onSignIn={() => setSignInOpen(true)} trailing={headerTrailing} />
      <div className="flex min-h-0 flex-1">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full w-full flex-col">
            <div className="flex-1">{content}</div>
            {!isWide && !ownScreen && view === "board" && <AgendaCartBar onEdit={() => undefined} onContinue={toCheckout} />}
          </div>
        </div>
        {isWide && !ownScreen && (
          <div className="w-96 shrink-0 overflow-y-auto border-l border-border bg-surface/60">
            <AgendaCartAside onEdit={toBoard} onContinue={view === "board" ? toCheckout : undefined} />
          </div>
        )}
      </div>
      <BookingSheet open={signInOpen} onOpenChange={setSignInOpen} title={t("booking.agenda.signInTitle")} description={t("booking.agenda.signInLead")}>
        <AgendaIdentity />
      </BookingSheet>
    </>
  );
}
