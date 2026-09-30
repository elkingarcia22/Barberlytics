import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { describePhone } from "./phoneLabel";

export interface LockedPanelProps {
  phone: string;
  onCreateTicket: () => void;
  onBack: () => void;
}

/** Tras varios intentos fallidos seguidos el celular queda bloqueado; la salida es un ticket a soporte. */
export function LockedPanel({ phone, onCreateTicket, onBack }: LockedPanelProps) {
  const t = useAppT();
  return (
    <div role="alert" data-testid="login-locked">
      <ThemaIcon name="securityLock" size="lg" tone="negative" className="mb-4" />
      <Heading level={3} id="login-heading">
        {t("auth.locked.title")}
      </Heading>
      <Text tone="secondary" className="mt-1.5">
        {t("auth.locked.description", { phone: describePhone(phone) })}
      </Text>
      <div className="mt-4 flex gap-2">
        <ThemaIcon name="info" size="sm" tone="muted" className="mt-0.5 shrink-0" />
        <Text size="sm" tone="secondary">
          {t("auth.locked.hint")}
        </Text>
      </div>
      <Button type="button" size="lg" className="btn-sweep mt-7 w-full" onClick={onCreateTicket} data-testid="locked-ticket">
        <ThemaIcon name="ticket" size="sm" tone="inverse" />
        {t("auth.locked.createTicket")}
      </Button>
      <Button type="button" variant="ghost" size="lg" className="mt-2 w-full" onClick={onBack}>
        {t("auth.recovery.back")}
      </Button>
    </div>
  );
}
