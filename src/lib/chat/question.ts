/** Con `ChatQuestion.multiple`, la respuesta une las opciones elegidas con esto. */
export const CHAT_MULTIPLE_SEPARATOR = " · ";

/** Las opciones elegidas de una respuesta de varias. */
export const splitMultipleAnswer = (answer: string): string[] => answer.split(CHAT_MULTIPLE_SEPARATOR);

/** Con `ChatQuestion.quantity`, una opción pedida varias veces va como «Cera mate × 2». */
export const CHAT_QUANTITY_MARK = " × ";

/** Una parte de la respuesta: la opción y cuántas se pidieron (1 si no lo dice). */
export function splitQuantity(part: string): { option: string; quantity: number } {
  const at = part.lastIndexOf(CHAT_QUANTITY_MARK);
  const quantity = at > 0 ? Number(part.slice(at + CHAT_QUANTITY_MARK.length)) : NaN;
  return Number.isInteger(quantity) && quantity > 0 ? { option: part.slice(0, at), quantity } : { option: part, quantity: 1 };
}

/** Cómo se escribe una opción con su cantidad en la respuesta. */
export const withQuantity = (option: string, quantity: number): string => (quantity > 1 ? `${option}${CHAT_QUANTITY_MARK}${quantity}` : option);
