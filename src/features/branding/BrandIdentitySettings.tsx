import * as React from "react";
import { logoShape } from "@/components/app-shell";
import { Field, FormSection } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadZone } from "@/components/upload";
import { QueryBoundary } from "@/lib/query";
import { ThemaIcon } from "@/icons";
import { BrandMenuPreview } from "./BrandMenuPreview";
import { useLogoEditor } from "./useLogoEditor";
import { logoQualityWarning } from "./logoFile";
import { useBrandingQuery, useSaveBranding } from "./queries";
import { BRAND_NAME_MAX, LOGO_ACCEPT, LOGO_MAX_MB, type Branding } from "./types";

interface Draft {
  name: string;
  logo: string | null;
  logoDark: string | null;
}

type LogoKey = "logo" | "logoDark";

const FALLBACK_NAME = "Barberlytics";

function toDraft(branding: Branding): Draft {
  return { name: branding.name ?? "", logo: branding.logo, logoDark: branding.logoDark };
}

const sameDraft = (a: Draft, b: Draft) => a.name.trim() === b.name.trim() && a.logo === b.logo && a.logoDark === b.logoDark;

export function LogoUpload({
  label,
  description,
  value,
  name,
  onChange,
}: {
  label: string;
  description: string;
  value: string | null;
  name: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const editor = useLogoEditor({
    name,
    onApply: (logo) => {
      onChange(logo.dataUrl);
      setWarning(logoQualityWarning(logo));
    },
  });

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      setError(null);
      await editor.edit(file);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo leer el archivo.");
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <Field label={label} description={description}>
          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-surface-subtle p-3">
            <span className="flex h-12 min-w-0 flex-1 items-center">
              <img src={value} alt={label} className="max-h-full max-w-full object-contain object-left" />
            </span>
            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => editor.editExisting(value)}>
              <ThemaIcon name="crop" size="sm" />
              Recortar
            </Button>
            <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={() => onChange(null)}>
              Quitar
            </Button>
          </div>
        </Field>
      ) : (
        <UploadZone
          label={label}
          description={description}
          value={[]}
          onChange={(files) => void handleFiles(files)}
          accept={LOGO_ACCEPT}
          maxSizeMB={LOGO_MAX_MB * 10}
          idleText="Arrastra tu logo aquí o haz clic para elegirlo"
          activeText="Suelta el logo aquí"
          error={error ?? undefined}
        />
      )}
      {warning && value && (
        <Alert variant="warning">
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      {editor.dialog}
    </div>
  );
}

function BrandIdentityForm({ branding }: { branding: Branding }) {
  const initial = React.useMemo(() => toDraft(branding), [branding]);
  const [draft, setDraft] = React.useState(initial);
  const [shape, setShape] = React.useState<ReturnType<typeof logoShape> | null>(null);
  const save = useSaveBranding();
  const dirty = !sameDraft(draft, initial);
  const name = draft.name.trim() || FALLBACK_NAME;
  const previewLogo = draft.logo ? { src: draft.logo, darkSrc: draft.logoDark } : null;

  React.useEffect(() => {
    if (!draft.logo) return;
    let active = true;
    const probe = new Image();
    probe.onload = () => active && setShape(logoShape(probe.naturalWidth, probe.naturalHeight));
    probe.src = draft.logo;
    return () => {
      active = false;
    };
  }, [draft.logo]);

  const setLogo = (key: LogoKey) => (value: string | null) =>
    setDraft((current) => (key === "logo" && !value ? { ...current, logo: null, logoDark: null } : { ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate({ name: draft.name.trim() || null, logo: draft.logo, logoDark: draft.logo ? draft.logoDark : null });
  };

  return (
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <FormSection
        title="Tu marca en el menú"
        description="Tu isologo y tu nombre, arriba del menú lateral de todo el equipo. Sin isologo propio se muestra la flecha de Barberlytics."
      >
        <Field label="Nombre de la barbería" description="Va al lado del isologo, con «Barbería» debajo. También es lo que leen los lectores de pantalla.">
          <Input
            value={draft.name}
            maxLength={BRAND_NAME_MAX}
            placeholder="Barbería La Esquina"
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>

        <LogoUpload
          label="Isologo"
          description="El símbolo de tu marca, con fondo transparente. PNG, SVG, JPG o WebP: al elegirlo lo recortas en cuadrado, lo acercas o lo giras. Es el que se ve sobre fondos claros."
          value={draft.logo}
          name={name}
          onChange={setLogo("logo")}
        />

        {draft.logo && shape === "wide" && (
          <Alert variant="warning">
            <AlertDescription>
              Esto parece un logotipo horizontal. En el menú va un isologo cuadrado de 32 px: con esta imagen se verá tu inicial. Sube el símbolo o la versión
              cuadrada de tu marca.
            </AlertDescription>
          </Alert>
        )}

        {draft.logo && (
          <LogoUpload
            label="Isologo para fondos oscuros (opcional)"
            description="Tu isologo en blanco o en colores claros. Sin él, en modo oscuro se muestra sobre una placa blanca."
            value={draft.logoDark}
            name={name}
            onChange={setLogo("logoDark")}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {branding.logo ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((current) => ({ ...current, logo: null, logoDark: null }))}>
              Volver a la flecha de Barberlytics
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!dirty || save.isPending} onClick={() => setDraft(initial)}>
              Descartar
            </Button>
            <Button type="submit" size="sm" disabled={!dirty || save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </FormSection>

      <Card className="space-y-4 p-card lg:sticky lg:top-4">
        <div>
          <Heading level={5}>Vista previa</Heading>
          <Text tone="secondary">A la izquierda, el menú plegado; a la derecha, la fila del menú abierto.</Text>
        </div>
        <BrandMenuPreview mode="light" logo={previewLogo} name={name} />
        <BrandMenuPreview mode="dark" logo={previewLogo} name={name} />
        <Text size="xs" tone="muted">
          Consejo: recorta el aire sobrante alrededor del símbolo y deja el fondo transparente; a 32 px cada píxel de margen cuenta.
        </Text>
      </Card>
    </form>
  );
}

/**
 * Ajuste «Identidad de marca»: la empresa sube su logo y su nombre, y el
 * menú lateral los encaja con `BrandSlot`. La vista previa usa ese mismo
 * componente, así lo que se ve aquí es exactamente lo que verá el equipo.
 */
export function BrandIdentitySettings() {
  const query = useBrandingQuery();
  return <QueryBoundary query={query}>{(branding) => <BrandIdentityForm key={branding.updatedAt ?? "sin-marca"} branding={branding} />}</QueryBoundary>;
}
