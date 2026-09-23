import * as React from "react";

/**
 * La foto de portada del login, servida desde `public/`. Es «Interior del
 * salón con lámparas colgantes» de Jason Leung en Unsplash (licencia
 * Unsplash, uso libre). Sin el archivo, el panel se queda con la atmósfera sola.
 */
export const LOGIN_HERO_IMAGE = "/login-barberia.webp";

/**
 * La fotografía de barbería del panel de portada, en duotono: se pasa a
 * blanco y negro, se baña con el primario del tema (`mix-blend-color`) y se
 * funde por abajo con el cromo para que el titular se lea. Cambiar de tema
 * cambia el baño; cambiar de modo, nada. Si la foto no carga, no deja hueco.
 */
export function LoginHeroImage() {
  const [isBroken, setIsBroken] = React.useState(false);
  if (isBroken) return null;

  return (
    <div aria-hidden data-slot="login-hero-image" className="absolute inset-0 overflow-hidden">
      <img
        src={LOGIN_HERO_IMAGE}
        alt=""
        width={1400}
        height={1750}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onError={() => setIsBroken(true)}
        className="h-full w-full object-cover object-center grayscale contrast-110"
      />
      <div className="absolute inset-0 bg-primary opacity-70 mix-blend-color" />
      <div className="absolute inset-0 bg-surface-nav opacity-30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-nav via-surface-nav/55 to-surface-nav/15" />
    </div>
  );
}
