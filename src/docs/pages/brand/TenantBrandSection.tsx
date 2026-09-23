import * as React from "react";
import { BrandSlot, type ShellBrandLogo } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/typography";
import { buildThemeTokens, useTheme, type ResolvedMode } from "@/themes";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection } from "../../components/PageIntro";

const svg = (body: string, width: number, height: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`)}`;

/** Isologos de ejemplo: uno oscuro sin versión para fondos oscuros, uno con ella, y un logotipo horizontal mal elegido. */
const SQUARE_DARK_ONLY: ShellBrandLogo = {
  src: svg('<circle cx="64" cy="64" r="60" fill="#1f2937"/><path d="M40 84 64 36l24 48" fill="none" stroke="#f9fafb" stroke-width="12" stroke-linejoin="round"/>', 128, 128),
};
const SQUARE_WITH_DARK: ShellBrandLogo = {
  src: svg('<rect x="8" y="8" width="112" height="112" rx="28" fill="#7a1f2b"/><text x="64" y="84" font-family="Georgia" font-size="56" font-weight="700" text-anchor="middle" fill="#f4e3c1">LE</text>', 128, 128),
  darkSrc: svg('<rect x="8" y="8" width="112" height="112" rx="28" fill="#f4e3c1"/><text x="64" y="84" font-family="Georgia" font-size="56" font-weight="700" text-anchor="middle" fill="#7a1f2b">LE</text>', 128, 128),
};
const WIDE: ShellBrandLogo = {
  src: svg('<text x="0" y="70" font-family="Georgia" font-size="72" font-weight="700" fill="#7a1f2b">Navaja</text>', 320, 96),
};

const CASES: { title: string; text: string; logo: ShellBrandLogo | null; name: string }[] = [
  { title: "Sin isologo propio", text: "La flecha de Barberlytics con el mismo formato: el menú nunca queda vacío.", logo: null, name: "Barberlytics" },
  { title: "Isologo con versión oscura", text: "Cada modo usa la suya.", logo: SQUARE_WITH_DARK, name: "La Esquina" },
  { title: "Isologo solo para fondos claros", text: "En oscuro va sobre una placa blanca para no desaparecer.", logo: SQUARE_DARK_ONLY, name: "Barbería Norte" },
  { title: "Logotipo horizontal (mal elegido)", text: "No cabe en 32 px: se muestra la inicial sobre el primario y el ajuste avisa.", logo: WIDE, name: "Navaja" },
];

const CODE = `// src/app/layouts/AppLayout.tsx
const { data: branding } = useBrandingQuery();

<AdminShell
  config={{
    brand: {
      productName: branding?.name ?? "Barberlytics",
      tagline: "Barbería",
      logo: branding?.logo ? { src: branding.logo, darkSrc: branding.logoDark } : null,
      display: "isologo",
    },
  }}
/>`;

function Preview({ mode, logo, name }: { mode: ResolvedMode; logo: ShellBrandLogo | null; name: string }) {
  const { preset } = useTheme();
  const tokens = React.useMemo(() => buildThemeTokens(preset, mode), [preset, mode]);
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3"
      style={{ ...(tokens as unknown as React.CSSProperties), background: "var(--color-bg-app)", color: "var(--color-text-primary)" }}
    >
      <span className="flex rounded-md bg-surface-nav p-1.5">
        <BrandSlot variant="icon" logo={logo} name={name} mode={mode} />
      </span>
      <span className="flex min-w-0 flex-1 rounded-xl border border-border/60 bg-surface px-3 py-2">
        <BrandSlot logo={logo} name={name} tagline="Barbería" mode={mode} className="flex-1" />
      </span>
    </div>
  );
}

/** Fundamentos → Marca: cómo entra la identidad de cada barbería en el menú. */
export function TenantBrandSection() {
  return (
    <DocSection
      id="marca-de-cada-barberia"
      title="La marca de cada barbería"
      description="Barberlytics es la plataforma; cada barbería trabaja con su propia identidad. Arriba del menú va su isologo en un cuadro de 32 px, su nombre al lado y «Barbería» debajo. La suben en Configuración → Negocio → Identidad de marca."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {CASES.map((item) => (
          <Card key={item.title} className="space-y-3 p-card">
            <div>
              <Heading level={5}>{item.title}</Heading>
              <Text tone="secondary">{item.text}</Text>
            </div>
            <Preview mode="light" logo={item.logo} name={item.name} />
            <Preview mode="dark" logo={item.logo} name={item.name} />
          </Card>
        ))}
      </div>
      <Card className="space-y-2 p-card">
        <Heading level={5}>Qué pedirle a la barbería</Heading>
        <Text tone="secondary">
          El isologo: el símbolo solo, cuadrado, con fondo transparente y sin aire sobrante alrededor. Mejor en SVG; si es PNG, de al menos 64 px de alto
          para que se vea nítido a 32 px en pantallas retina. Opcional, una versión en blanco o en colores claros para el modo oscuro. El nombre viaja como
          texto, así que no hace falta que el isologo lo lleve.
        </Text>
      </Card>
      <CodeBlock code={CODE} />
    </DocSection>
  );
}
