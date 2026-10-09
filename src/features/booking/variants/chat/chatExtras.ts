import type { useAppT } from "@/app/i18n";
import { splitMultipleAnswer, splitQuantity } from "@/lib/chat";
import type { BookingAction, BookingState } from "../../bookingState";
import type { BookingFormatters } from "../../bookingFormat";
import { MAX_REFERENCE_PHOTOS, prepareReferencePhoto } from "../../flow/referencePhoto";
import type { BookingCatalog } from "../../types";
import type { Expecting, MessageInput } from "./chatKit";
import { makeQuestion, type BookingQuestion } from "./chatQuestions";

/** Lo más que se lleva de un mismo producto, como en la tienda de las otras versiones. */
const MAX_QTY = 9;
const SKIP = /^(no|nada|ninguna|cancelar|mejor no|sin nota|no gracias)$/;
const plain = (value: string): string => value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.,!¡]/g, "");

export interface ExtrasKit {
  t: ReturnType<typeof useAppT>;
  fmt: BookingFormatters;
  apply: (action: BookingAction) => void;
  say: (...messages: MessageInput[]) => void;
  ask: (question: BookingQuestion, text?: string) => void;
  expect: (next: Expecting) => void;
  stateRef: { readonly current: BookingState };
  catalogRef: { readonly current: BookingCatalog | undefined };
  /** Lo que escribió el cliente, con las fotos que mandó. */
  pushUser: (text: string, photos?: readonly string[]) => void;
  askMore: (text?: string) => void;
}

/**
 * Lo que se suma a la reserva después de apartar: productos de la tienda (cada
 * uno con su cantidad, − 1 + en la lista) y la nota para el barbero, que puede
 * llevar hasta tres fotos del corte que se quiere (se adjuntan desde la caja,
 * como en WhatsApp, y llegan a la cita igual que en las otras versiones).
 */
export function useChatExtras(kit: ExtrasKit) {
  const { t, fmt, apply, say, ask, expect, stateRef, catalogRef, pushUser, askMore } = kit;

  const askProducts = () => {
    const products = catalogRef.current?.products ?? [];
    ask(
      makeQuestion(
        "products",
        t("booking.chat.productsTitle"),
        products.map((product) => ({ label: product.name, value: product.id, description: `${fmt.money(product.price)}${product.category ? ` · ${product.category}` : ""}`, ...(product.imageUrl ? { image: product.imageUrl } : {}) })),
        { hint: t("booking.chat.productsHint"), searchPlaceholder: t("booking.chat.productsSearch"), multiple: { confirmLabel: t("booking.chat.productsAdd") }, quantity: { max: MAX_QTY } }
      )
    );
  };

  /** «Cera mate × 2 · Shampoo»: cada producto queda con la cantidad elegida. */
  const answerProducts = (question: BookingQuestion, label: string) => {
    const picked = splitMultipleAnswer(label).map(splitQuantity);
    for (const { option, quantity } of picked) {
      const id = question.values[option];
      if (id) apply({ type: "setProduct", productId: id, qty: Math.min(MAX_QTY, quantity) });
    }
    askMore(t("booking.chat.productsAdded", { items: picked.map(({ option, quantity }) => (quantity > 1 ? `${option} × ${quantity}` : option)).join(", ") }));
  };

  const askNote = () => {
    expect("note");
    const room = MAX_REFERENCE_PHOTOS - stateRef.current.referencePhotos.length;
    say({ text: room > 0 ? t("booking.chat.askNote", { count: room }) : t("booking.chat.askNoteNoRoom") });
  };

  /** La nota y sus fotos: el texto se suma a las notas y las fotos a la cita, hasta tres. */
  const submitNote = async (text: string, files: readonly File[]) => {
    // «No», «nada», «mejor no»: sin nota.
    if (files.length === 0 && SKIP.test(plain(text))) {
      pushUser(text);
      expect(null);
      return askMore(t("booking.chat.noNote"));
    }
    const room = MAX_REFERENCE_PHOTOS - stateRef.current.referencePhotos.length;
    const images = files.filter((file) => file.type.startsWith("image/"));
    const prepared = await Promise.all(images.slice(0, Math.max(0, room)).map((file) => prepareReferencePhoto(file).catch(() => null)));
    const photos = prepared.filter((photo): photo is string => photo !== null);
    pushUser(text, photos);
    expect(null);
    if (text.trim()) apply({ type: "setNotes", notes: [stateRef.current.notes, text.trim()].filter(Boolean).join("\n") });
    photos.forEach((photo) => apply({ type: "addReferencePhoto", photo }));
    const failed = prepared.length - photos.length;
    const left = images.length - prepared.length;
    const lines = [
      photos.length > 0 ? t(text.trim() ? "booking.chat.notedWithPhotos" : "booking.chat.photosNoted", { count: photos.length }) : t("booking.chat.noted"),
      failed > 0 ? t("booking.chat.photoFailed", { count: failed }) : "",
      left > 0 ? t("booking.chat.photosLimit", { max: MAX_REFERENCE_PHOTOS }) : "",
    ];
    askMore(lines.filter(Boolean).join(" "));
  };

  return { askProducts, answerProducts, askNote, submitNote };
}
