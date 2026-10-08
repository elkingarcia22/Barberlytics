/**
 * La tarjeta escrita a mano: cómo se agrupa mientras se teclea y qué le
 * falta para poder cobrarse. Sin interfaz, para que el paso de pago y las
 * pruebas usen la misma regla.
 */
export const digitsOf = (value: string): string => value.replace(/\D/g, "");
/** «4242424242424242» → «4242 4242 4242 4242». */
export const groupCard = (value: string): string => digitsOf(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
/** «1228» → «12/28». */
export const groupExpiry = (value: string): string => {
  const digits = digitsOf(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export type CardBrand = "visa" | "mastercard" | "amex" | "other";

/** La marca por los primeros dígitos (los rangos públicos de cada red). */
export function cardBrandOf(value: string): CardBrand {
  const digits = digitsOf(value);
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "other";
}

/** La marca tal como la guarda la pasarela («Visa», «Mastercard») a la de la interfaz. */
export function brandFromName(name: string): CardBrand {
  const plain = name.toLowerCase();
  return plain.includes("visa") ? "visa" : plain.includes("master") ? "mastercard" : plain.includes("amex") || plain.includes("american") ? "amex" : "other";
}

/** Amex pide 4 dígitos de CVC; las demás, 3. */
export const cvcLengthOf = (brand: CardBrand): number => (brand === "amex" ? 4 : 3);

export interface CardValues {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

const MIN_CARD = 13;
const MIN_NAME = 3;

function expiryOk(expiry: string, now = new Date()): boolean {
  const [month, year] = expiry.split("/").map(Number);
  if (!month || year === undefined || Number.isNaN(year) || month < 1 || month > 12) return false;
  const end = new Date(2000 + year, month, 1);
  return end.getTime() > now.getTime();
}

export function cardErrors(values: CardValues) {
  return {
    number: digitsOf(values.number).length < MIN_CARD,
    expiry: !expiryOk(values.expiry),
    cvc: digitsOf(values.cvc).length < cvcLengthOf(cardBrandOf(values.number)),
    name: values.name.trim().length < MIN_NAME,
  };
}

export const isCardComplete = (values: CardValues): boolean => !Object.values(cardErrors(values)).some(Boolean);

/** El CVC de una tarjeta guardada: se vuelve a pedir y se revisa solo su largo. */
export const isCvcComplete = (cvc: string, brand: CardBrand): boolean => digitsOf(cvc).length === cvcLengthOf(brand);

