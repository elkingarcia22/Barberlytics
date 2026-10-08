import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field, InputOtp } from "@/components/forms";
import { Spinner } from "@/components/feedback/Spinner";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { describeError, isApiError } from "@/lib/api";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";
import { useRequestCodeMutation, useVerifyCodeMutation } from "../queries";

const CODE_LENGTH = 6;
/** Segundos antes de poder pedir otro código. */
const RESEND_AFTER_S = 30;

/** Los intentos que le quedan, si el servidor los dijo. */
const attemptsLeftFrom = (error: unknown): number | null => {
  const details = isApiError(error) ? error.details : undefined;
  const left = details && typeof details === "object" && "attemptsLeft" in details ? (details as { attemptsLeft?: unknown }).attemptsLeft : undefined;
  return typeof left === "number" ? left : null;
};

/**
 * El código que llegó al celular. Prueba que el número es suyo antes de enseñar
 * nada de su perfil (tarjetas, saldo, personas guardadas) y entrega la sesión
 * con la que se reserva. Se puede pedir otro tras unos segundos o cambiar el número.
 */
export function VerifyStep() {
  const t = useAppT();
  const { state, dispatch, shop } = useBookingFlow();
  const verify = useVerifyCodeMutation();
  const resend = useRequestCodeMutation();
  const [code, setCode] = React.useState("");
  const [wait, setWait] = React.useState(RESEND_AFTER_S);
  const sent = state.codeSentTo;

  React.useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = window.setTimeout(() => setWait((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const check = (value: string) =>
    verify.mutate(
      { phone: state.phone, code: value },
      {
        onSuccess: (result) => {
          if (result.status === "known") dispatch({ type: "customerFound", customer: result.customer, token: result.token });
          else if (result.status === "new") dispatch({ type: "customerIsNew", token: result.token });
          else dispatch({ type: "customerBlocked" });
        },
        onError: () => setCode(""),
      }
    );

  const left = attemptsLeftFrom(verify.error);
  const error = verify.isError
    ? left !== null && left > 0
      ? t("booking.verify.wrong", { count: left })
      : describeError(verify.error).description
    : resend.isError
      ? describeError(resend.error).description
      : undefined;

  if (!sent) return null;

  return (
    <StepLayout focusTitle={false} title={t("booking.verify.title")} lead={t(sent.channel === "whatsapp" ? "booking.verify.leadWhatsapp" : "booking.verify.leadSms", { phone: sent.sentTo })}>
      <Field label={t("booking.manage.code")} error={error}>
        <InputOtp length={CODE_LENGTH} value={code} onChange={setCode} onComplete={check} groups={[3, 3]} autoFocus disabled={verify.isPending} />
      </Field>
      {verify.isPending && (
        <Text size="sm" tone="muted" className="flex items-center gap-2">
          <Spinner size="sm" />
          {t("booking.verify.checking")}
        </Text>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0"
          disabled={wait > 0 || resend.isPending}
          onClick={() =>
            resend.mutate(state.phone, {
              onSuccess: (next) => {
                dispatch({ type: "codeSent", phone: state.phone, sentTo: next.sentTo, channel: next.channel });
                setWait(RESEND_AFTER_S);
                setCode("");
                verify.reset();
              },
            })
          }
        >
          {wait > 0 ? t("booking.verify.resendIn", { seconds: wait }) : t("booking.manage.resend")}
        </Button>
        <Button type="button" variant="link" size="sm" className="px-0" onClick={() => dispatch({ type: "goTo", step: "phone" })}>
          {t("booking.verify.changePhone")}
        </Button>
      </div>
      <Text size="xs" tone="muted" className="flex items-start gap-1.5">
        <ThemaIcon name="securityLock" size="xs" className="mt-0.5" />
        {t("booking.verify.why", { shop: shop.name })}
      </Text>
    </StepLayout>
  );
}
