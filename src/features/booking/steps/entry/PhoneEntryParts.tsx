import { useAppT } from "@/app/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { ThemaIcon } from "@/icons";
import type { PhoneEntry } from "./usePhoneEntry";

/** El campo del celular, igual en los tres diseños. */
export function PhoneEntryField({ entry, autoFocus = true }: { entry: PhoneEntry; autoFocus?: boolean }) {
  const t = useAppT();
  return (
    <Field label={t("booking.phone.label")} description={t("booking.phone.hint")} error={entry.error}>
      <PhoneInput value={entry.phone} onValueChange={entry.setPhone} defaultCountry="CO" autoFocus={autoFocus} autoComplete="tel-national" />
    </Field>
  );
}

/** El botón de seguir y el aviso de mensajes. */
export function PhoneEntryActions({ entry }: { entry: PhoneEntry }) {
  const t = useAppT();
  return (
    <div className="flex flex-col gap-2">
      <Button type="submit" size="lg" className="w-full" disabled={entry.isPending}>
        {entry.isPending ? <Spinner size="sm" tone="inverse" /> : null}
        {t("booking.phone.continue")}
        {!entry.isPending && <ThemaIcon name="arrowRight" />}
      </Button>
      <Text size="xs" tone="muted" className="text-center">
        {t("booking.phone.consent")}
      </Text>
    </div>
  );
}
