import { BrandSlot } from "@/components/app-shell";
import type { BookingShop } from "../types";

interface ShopBrandProps {
  shop: Pick<BookingShop, "name" | "logoUrl" | "logoDarkUrl">;
  /** La línea bajo el nombre (la sede); sin ella, solo el nombre. */
  tagline?: string;
  /** Solo el cuadro del logo, sin el nombre. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * La marca de la barbería en la reserva: la misma pieza del menú lateral de la
 * app. Con el isologo que subió la barbería en Identidad de marca y su nombre;
 * si no subió nada, la flecha de Barberlytics y «Barberlytics».
 */
export function ShopBrand({ shop, tagline, iconOnly = false, className }: ShopBrandProps) {
  const logo = shop.logoUrl ? { src: shop.logoUrl, darkSrc: shop.logoDarkUrl } : null;
  return <BrandSlot logo={logo} name={shop.name} tagline={tagline} variant={iconOnly ? "icon" : "row"} className={className} />;
}
