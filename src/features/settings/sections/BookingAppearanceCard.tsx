import * as React from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { SegmentedGroup } from "@/components/ui/segmented-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BARBERLYTICS_DEFAULT_LOGO } from "@/components/ui/barberlyticsBrandColors";
import { LogoUpload, useBrandingQuery } from "@/features/branding";
import { ThemaIcon } from "@/icons";
import { useLocale } from "@/i18n";
import type { BookingAppearance, BookingAppearanceLocale, BookingAppearanceMode } from "@/lib/booking/appearance";
import { cn } from "@/lib/utils";
import { CUSTOM_THEME_ID, CustomColorsEditor, DEFAULT_CUSTOM_COLORS, THEME_PRESETS, ThemeSwatch, useTheme } from "@/themes";
import { SettingsCard, SwitchRow } from "../SettingsFormParts";

const SWATCH =
  "relative flex size-7 shrink-0 items-center justify-center rounded-full p-0.5 ring-2 ring-transparent transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-primary/60";

interface BookingAppearanceCardProps {
  value: BookingAppearance;
  onChange: (appearance: BookingAppearance) => void;
}

/**
 * «Apariencia de la reserva»: cómo ven los clientes la reserva en línea. Se guarda en la
 * barbería (no en este navegador), con el resto de Reserva online. Por defecto la general;
 * si no, tema o colores propios, modo, idioma y un logo solo para la reserva.
 */
export function BookingAppearanceCard({ value, onChange }: BookingAppearanceCardProps) {
  const t = useAppT();

  return (
    <SettingsCard
      title={t("cfg.booking.appearance")}
      description={t("cfg.booking.appearanceHint")}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/reservar">
            <ThemaIcon name="expand" size="sm" />
            {t("cfg.booking.appearance.preview")}
          </Link>
        </Button>
      }
    >
      <SwitchRow
        label={t("cfg.booking.appearance.general")}
        hint={t("cfg.booking.appearance.generalHint")}
        checked={value.useGeneral}
        onCheckedChange={(checked) => onChange({ ...value, useGeneral: checked })}
        testId="booking-appearance-general"
      />
      {!value.useGeneral && <OwnAppearance value={value} onChange={onChange} />}
    </SettingsCard>
  );
}

function OwnAppearance({ value, onChange }: BookingAppearanceCardProps) {
  const t = useAppT();
  const { snapshot } = useTheme();
  const { locale } = useLocale();
  const { data: branding } = useBrandingQuery();
  const set = <K extends keyof BookingAppearance>(key: K, next: BookingAppearance[K]) => onChange({ ...value, [key]: next });
  const isCustom = value.theme === CUSTOM_THEME_ID;
  const custom = value.custom ?? DEFAULT_CUSTOM_COLORS;
  // Los colores que propone «Desde tu logo»: el de la reserva, si tiene; si no, el de Identidad de marca.
  const logoSrc = value.logo ?? branding?.logo ?? null;
  const name = branding?.name ?? "Barberlytics";
  const themeLabelId = React.useId();

  // Trae la Personalización de este navegador: color (o colores propios), modo e idioma.
  const copyMine = () => {
    onChange({
      ...value,
      theme: snapshot.preset,
      custom: snapshot.preset === CUSTOM_THEME_ID ? (snapshot.custom ?? DEFAULT_CUSTOM_COLORS) : value.custom,
      mode: snapshot.mode,
      locale: locale === "en" ? "en" : "es",
    });
    toast(t("cfg.booking.appearance.copied"));
  };

  return (
    <div className="space-y-6" data-testid="booking-appearance-own">
      <Button type="button" variant="outline" size="sm" onClick={copyMine} data-testid="booking-appearance-copy">
        <ThemaIcon name="copy" size="sm" />
        {t("cfg.booking.appearance.copyMine")}
      </Button>

      <div className="min-w-0 space-y-2">
        <Text id={themeLabelId} size="xs" weight="semibold" tone="muted" className="uppercase tracking-widest">
          {t("cfg.booking.appearance.theme")}
        </Text>
        <div role="radiogroup" aria-labelledby={themeLabelId} className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const active = value.theme === preset.id;
            return (
              <Tooltip key={preset.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={preset.name}
                    onClick={() => set("theme", preset.id)}
                    className={cn(SWATCH, active ? "ring-primary" : "hover:ring-border-strong/60")}
                  >
                    <ThemeSwatch preset={preset} className="size-full" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{preset.description}</TooltipContent>
              </Tooltip>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={isCustom}
            aria-label={t("cfg.booking.appearance.custom")}
            data-testid="booking-appearance-custom"
            onClick={() => onChange({ ...value, theme: CUSTOM_THEME_ID, custom })}
            className={cn(SWATCH, isCustom ? "ring-primary" : "hover:ring-border-strong/60")}
          >
            <span
              aria-hidden
              className="block size-full rounded-full ring-1 ring-black/10 dark:ring-white/15"
              style={{ background: `linear-gradient(135deg, ${custom.primary} 50%, ${custom.secondary} 50%)` }}
            />
          </button>
        </div>
        {isCustom && (
          <CustomColorsEditor value={custom} onChange={(colors) => set("custom", colors)} logoSrc={logoSrc} defaultLogo={BARBERLYTICS_DEFAULT_LOGO} />
        )}
      </div>

      <SegmentedGroup<BookingAppearanceMode>
        label={t("cfg.booking.appearance.mode")}
        value={value.mode}
        onChange={(mode) => set("mode", mode)}
        options={[
          { id: "light", label: t("cfg.booking.appearance.mode.light") },
          { id: "dark", label: t("cfg.booking.appearance.mode.dark") },
          { id: "system", label: t("cfg.booking.appearance.mode.system") },
        ]}
        hint={t("cfg.booking.appearance.modeHint")}
      />

      <SegmentedGroup<BookingAppearanceLocale>
        label={t("cfg.booking.appearance.locale")}
        value={value.locale}
        onChange={(next) => set("locale", next)}
        options={[
          { id: "es", label: "Español" },
          { id: "en", label: "English" },
          { id: "auto", label: t("cfg.booking.appearance.locale.auto") },
        ]}
        hint={t("cfg.booking.appearance.localeHint")}
      />

      <LogoUpload
        label={t("cfg.booking.appearance.logo")}
        description={t("cfg.booking.appearance.logoHint")}
        value={value.logo}
        name={name}
        // Sin logo de la reserva tampoco hay versión oscura que valga.
        onChange={(logo) => onChange({ ...value, logo, logoDark: logo ? value.logoDark : null })}
      />
      {value.logo && (
        <LogoUpload
          label={t("cfg.booking.appearance.logoDark")}
          description={t("cfg.booking.appearance.logoDarkHint")}
          value={value.logoDark}
          name={name}
          onChange={(logoDark) => set("logoDark", logoDark)}
        />
      )}
    </div>
  );
}
