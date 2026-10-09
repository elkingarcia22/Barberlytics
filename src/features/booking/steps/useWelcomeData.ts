import { defaultBranchId } from "../bookingState";
import { useBookingFlow } from "../flow/BookingContext";
import { useBookingCatalogQuery, useVisitSuggestionQuery } from "../queries";
import { itemPrice } from "../useBookingTotals";

/**
 * Lo que necesita la bienvenida del cliente que vuelve: su última visita (servicios, barbero, sede
 * y precio), la propuesta de su próxima visita según su ritmo y las acciones del paso.
 */
export function useWelcomeData() {
  const { state, dispatch, shop, fmt, layout } = useBookingFlow();
  const customer = state.customer;
  const last = customer?.lastVisit ?? null;
  const branch = shop.branches.find((item) => item.id === last?.branchId);
  const { data: catalog, isLoading: isCatalogLoading } = useBookingCatalogQuery(last?.branchId ?? null);
  const barber = catalog?.barbers.find((item) => item.id === last?.barberId) ?? null;
  const services = (last?.serviceIds ?? []).map((id) => catalog?.services.find((item) => item.id === id)).filter((item) => item !== undefined);
  const canRepeat = last !== null && branch !== undefined && services.length > 0;
  const onlyBranchId = defaultBranchId(customer, shop.branches.map((item) => item.id));
  const { data: suggestionData, isLoading: isSuggesting } = useVisitSuggestionQuery(state.token);
  const suggestion = suggestionData?.suggestion ?? null;
  const price = last ? itemPrice({ serviceIds: services.map((item) => item.id), barberId: last.barberId }, catalog) : 0;
  const durationMin = services.reduce((sum, item) => sum + item.durationMin, 0);

  const actions = {
    repeat: () => last && dispatch({ type: "repeatLastVisit", lastVisit: { ...last, serviceIds: services.map((item) => item.id), barberId: barber ? barber.id : null } }),
    book: (option: { start: string; barberId: string }) =>
      suggestion && dispatch({ type: "acceptSuggestion", branchId: suggestion.branchId, serviceIds: suggestion.serviceIds, barberId: option.barberId, start: option.start }),
    startFresh: () => dispatch({ type: "startFresh", onlyBranchId }),
    manage: () => dispatch({ type: "openManage" }),
    packages: () => dispatch({ type: "goTo", step: "packages" }),
    gift: () => dispatch({ type: "goTo", step: "gift" }),
    notYou: () => dispatch({ type: "restart" }),
  };

  return {
    customer,
    last,
    branch,
    catalog,
    barber,
    services,
    canRepeat,
    suggestion,
    price,
    durationMin,
    isLoading: isCatalogLoading || isSuggesting,
    hasPackages: shop.packages.length > 0,
    canGift: shop.payment.card,
    fmt,
    layout,
    actions,
  };
}

export type WelcomeData = ReturnType<typeof useWelcomeData>;
