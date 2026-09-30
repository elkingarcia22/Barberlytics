import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { NumberField, PHONE_COUNTRIES, PhoneInput } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemaIcon } from "@/icons";
import { describeError } from "@/lib/api";
import { authApi } from "./api";
import { AuthField, BackButton, FormErrorAlert } from "./authFormParts";
import { applyServerFieldErrors } from "./authErrors";
import { describeTimezone, timezonesFor } from "./timezones";
import { signupRequestSchema, type SignupRequest } from "./types";

export interface SignupPanelProps {
  onBack: () => void;
}

const COUNTRIES = [...PHONE_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "es"));

/**
 * Crear cuenta: los datos de la persona y de la barbería. La zona horaria se
 * elige entre las del país; si el país tiene una sola, queda puesta.
 */
export function SignupPanel({ onBack }: SignupPanelProps) {
  const t = useAppT();
  const [done, setDone] = React.useState<Pick<SignupRequest, "email" | "company"> | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<SignupRequest>({
    resolver: zodResolver(signupRequestSchema),
    defaultValues: { firstName: "", lastName: "", company: "", email: "", phone: "", barbers: undefined, country: "", timezone: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const country = useWatch({ control: form.control, name: "country" });
  const timezones = timezonesFor(country);

  const changeCountry = (value: string) => {
    const zones = timezonesFor(value);
    form.setValue("country", value, { shouldValidate: form.formState.isSubmitted });
    form.setValue("timezone", zones.length === 1 ? zones[0] : "", { shouldValidate: form.formState.isSubmitted });
  };

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authApi.signup(values);
      setDone({ email: values.email, company: values.company });
    } catch (error) {
      if (!applyServerFieldErrors(error, form.setError)) setServerError(describeError(error).description);
    }
  });

  if (done) {
    return (
      <>
        <ThemaIcon name="success" size="lg" tone="positive" className="mb-4" />
        <Heading level={3} id="login-heading">
          {t("auth.signup.doneTitle")}
        </Heading>
        <Text tone="secondary" className="mt-1.5">
          {t("auth.signup.done", done)}
        </Text>
        <Button type="button" size="lg" className="mt-7 w-full" onClick={onBack}>
          {t("auth.recovery.back")}
        </Button>
      </>
    );
  }

  return (
    <>
      <BackButton label={t("auth.recovery.back")} onClick={onBack} disabled={isSubmitting} />
      <Heading level={3} id="login-heading">
        {t("auth.signup.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.signup.description")}
      </Text>

      <form onSubmit={submit} noValidate className="mt-7 space-y-4" data-testid="signup-form">
        {serverError && <FormErrorAlert title={t("auth.signup.errorTitle")} description={serverError} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="signup-first-name" label={t("auth.signup.firstName")} error={errors.firstName?.message}>
            {(control) => <Input {...control} autoComplete="given-name" autoFocus disabled={isSubmitting} {...form.register("firstName")} />}
          </AuthField>
          <AuthField id="signup-last-name" label={t("auth.signup.lastName")} error={errors.lastName?.message}>
            {(control) => <Input {...control} autoComplete="family-name" disabled={isSubmitting} {...form.register("lastName")} />}
          </AuthField>
        </div>

        <AuthField id="signup-company" label={t("auth.signup.company")} error={errors.company?.message}>
          {(control) => <Input {...control} autoComplete="organization" disabled={isSubmitting} {...form.register("company")} />}
        </AuthField>

        <AuthField id="signup-email" label={t("auth.signup.email")} error={errors.email?.message}>
          {(control) => <Input {...control} type="email" autoComplete="email" disabled={isSubmitting} {...form.register("email")} />}
        </AuthField>

        <AuthField id="signup-phone" label={t("auth.signup.phone")} error={errors.phone?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <PhoneInput {...control} name={field.name} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} disabled={isSubmitting} />
              )}
            />
          )}
        </AuthField>

        <AuthField id="signup-barbers" label={t("auth.signup.barbers")} error={errors.barbers?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="barbers"
              render={({ field }) => (
                <NumberField
                  {...control}
                  name={field.name}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value ?? undefined)}
                  onBlur={field.onBlur}
                  min={1}
                  max={500}
                  step={1}
                  disabled={isSubmitting}
                />
              )}
            />
          )}
        </AuthField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="signup-country" label={t("auth.signup.country")} error={errors.country?.message}>
            {(control) => (
              <Select value={country} onValueChange={changeCountry} disabled={isSubmitting}>
                <SelectTrigger {...control} className="w-full">
                  <SelectValue placeholder={t("auth.signup.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      <span aria-hidden="true" className="mr-2">
                        {item.flag}
                      </span>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </AuthField>
          <AuthField id="signup-timezone" label={t("auth.signup.timezone")} error={errors.timezone?.message}>
            {(control) => (
              <Controller
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  // Remontar por país: si el valor llega antes que sus opciones, el select nativo de Radix lo vacía.
                  <Select key={country} value={field.value} onValueChange={field.onChange} disabled={isSubmitting || timezones.length === 0}>
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue placeholder={t(country ? "auth.signup.timezonePlaceholder" : "auth.signup.timezoneNeedsCountry")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {describeTimezone(zone)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </AuthField>
        </div>

        <Button type="submit" size="lg" className="btn-sweep mt-2 w-full" disabled={isSubmitting} data-testid="signup-submit">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <ThemaIcon name="userAdd" size="sm" tone="inverse" />}
          {t("auth.signup.submit")}
        </Button>
      </form>

      <Text size="sm" tone="secondary" className="mt-5 text-center">
        {t("auth.signup.hasAccount")}{" "}
        <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onBack} disabled={isSubmitting}>
          {t("auth.title")}
        </Button>
      </Text>
    </>
  );
}
