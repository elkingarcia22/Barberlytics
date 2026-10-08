import * as React from "react";
import type { BookingCustomer, SavedCard } from "../types";
import { useBookingFlow } from "./BookingContext";
import { firstUsableCard } from "./cardValidation";
import { EditSavedCardSheet, RemoveSavedCardSheet } from "./SavedCardSheets";

interface SavedCardManagerOptions {
  /** La elegida en el selector (id o la opción «tarjeta nueva»). */
  choice: string;
  /** El valor de la opción «tarjeta nueva» del selector. */
  newCard: string;
  /** Hay una tarjeta nueva escrita (sin guardar) en la lista. */
  hasPending: boolean;
  choose: (value: string) => void;
  /** Olvida la tarjeta nueva escrita. */
  clearPending: () => void;
}

/**
 * Editar y quitar tarjetas desde el selector, igual en Pagar y en Regalar: las
 * dos hojas, qué queda elegido después y los callbacks para `SavedCardPicker`.
 */
export function useSavedCardManager({ choice, newCard, hasPending, choose, clearPending }: SavedCardManagerOptions) {
  const { state } = useBookingFlow();
  const cards = state.customer?.cards ?? [];
  // La tarjeta se conserva al cerrar para que la hoja no se vacíe mientras sale; `openedAt` reinicia el formulario.
  const [sheet, setSheet] = React.useState<{ kind: "edit" | "remove"; card: SavedCard; open: boolean; openedAt: number } | null>(null);
  const close = () => setSheet((current) => (current ? { ...current, open: false } : current));
  // Tras quitar la elegida, pasa a otra que sirva; tras renovar una vencida sin otra elegida, queda esa.
  const afterChange = (updated: BookingCustomer) => {
    if (!sheet) return;
    if (sheet.kind === "remove" && choice === sheet.card.id) choose(hasPending ? newCard : firstUsableCard(updated.cards, newCard));
    if (sheet.kind === "edit" && choice === newCard && !hasPending) choose(firstUsableCard(updated.cards, newCard));
  };
  const edit = sheet?.kind === "edit" ? sheet : null;
  const remove = sheet?.kind === "remove" ? sheet : null;

  return {
    onEditCard: (card: SavedCard) => setSheet({ kind: "edit", card, open: true, openedAt: Date.now() }),
    onRemoveCard: (card: SavedCard) => setSheet({ kind: "remove", card, open: true, openedAt: Date.now() }),
    onRemovePending: () => {
      clearPending();
      if (choice === newCard) choose(firstUsableCard(cards, newCard));
    },
    sheets: (
      <>
        <EditSavedCardSheet key={edit?.openedAt ?? "edit"} card={edit?.card ?? null} open={edit?.open ?? false} onClose={close} onDone={afterChange} />
        <RemoveSavedCardSheet card={remove?.card ?? null} open={remove?.open ?? false} onClose={close} onDone={afterChange} />
      </>
    ),
  };
}
