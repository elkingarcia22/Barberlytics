import { consentCountryOf } from "@/features/legal/consent";

/**
 * Cuánto cuesta un mensaje de marketing por WhatsApp según el país del cliente (docs/API_CONTRACT.md, «Clientes ›
 * Grupos y campañas»). Es el precio de lista de Meta por mensaje de plantilla de marketing, en dólares, tomado como
 * referencia: la cifra real sale de la factura de Meta (cambia por país y por volumen). Sirve para estimar antes de
 * mandar, no para cobrar. Sin dependencias: lo usan la app y el servidor.
 */

export const MARKETING_PRICE_USD: Readonly<Record<"CO" | "MX" | "US" | "GENERIC", number>> = {
  CO: 0.0125,
  MX: 0.0305,
  US: 0.025,
  GENERIC: 0.0604,
};

/** El precio de un mensaje de marketing para una sede de ese país (código o nombre). */
export const marketingPriceFor = (country: string | null | undefined): number => MARKETING_PRICE_USD[consentCountryOf(country)];

/** Lo que costaría mandar a esos destinatarios (un país por cada uno), redondeado a centavos. */
export function estimateCost(countries: readonly (string | null | undefined)[]): number {
  return Math.round(countries.reduce((total, country) => total + marketingPriceFor(country), 0) * 100) / 100;
}
