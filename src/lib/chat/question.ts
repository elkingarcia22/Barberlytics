/** Con `ChatQuestion.multiple`, la respuesta une las opciones elegidas con esto. */
export const CHAT_MULTIPLE_SEPARATOR = " · ";

/** Las opciones elegidas de una respuesta de varias. */
export const splitMultipleAnswer = (answer: string): string[] => answer.split(CHAT_MULTIPLE_SEPARATOR);
