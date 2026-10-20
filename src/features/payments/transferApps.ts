import { packCountryOf } from "@/features/settings/countryPack";

/**
 * Por dónde llega una transferencia según el país de la sede: en Colombia Nequi, Daviplata y Bre-B; en México SPEI; en
 * EE. UU. Zelle y Venmo; en todas, la transferencia bancaria. Sin dependencias de pantalla: lo usan la caja y el
 * recibo. Son nombres de marca: no se traducen (salvo «banco»).
 */

export type TransferVia = "nequi" | "daviplata" | "breb" | "spei" | "zelle" | "venmo" | "bank";

const BRAND_NAMES: Readonly<Partial<Record<TransferVia, string>>> = { nequi: "Nequi", daviplata: "Daviplata", breb: "Bre-B", spei: "SPEI", zelle: "Zelle", venmo: "Venmo" };

/** Las formas de transferir de la sede, la más usada primero. */
export function transferAppsFor(country: string | null | undefined): TransferVia[] {
  switch (packCountryOf(country)) {
    case "CO":
      return ["nequi", "breb", "daviplata", "bank"];
    case "MX":
      return ["spei", "bank"];
    case "US":
      return ["zelle", "venmo", "bank"];
    default:
      return ["bank"];
  }
}

/** El nombre de la forma de transferir; «banco» lo traduce quien llama. */
export const transferBrand = (via: string): string | null => BRAND_NAMES[via as TransferVia] ?? (via === "bank" ? null : via);
