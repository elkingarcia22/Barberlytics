import * as React from "react";
import { BellOff, BellRing, CreditCard, Gift, Hourglass, MessageCircle, Package, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { ConfirmDialog } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { MESSAGE_KIND_KEYS } from "@/features/calendar/messages";
import { InfoCard, InfoRow } from "@/features/team/teamShared";
import { branchName } from "./customersUtils";
import { useCustomerRelationship, useSetMarketingConsent, type CustomerRelationship } from "./relationship";
import { useBranchConsentPack } from "@/features/legal/useConsentPack";
import { useCustomerQuery } from "./queries";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const DAY_TIME: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
};
const MAX_STARS = 5;
const SOURCE_KEYS = {
  booking: "customers.rel.sourceBooking",
  app: "customers.rel.sourceApp",
  whatsapp: "customers.rel.sourceWhatsapp",
  sms: "customers.rel.sourceSms",
} as const;

interface RelationshipProps {
  customerId: string;
  formatMoney: (value: number) => string;
  /** Saldo y tarjetas de regalo son dinero: recepción no los ve. */
  showMoney: boolean;
  /** Las tarjetas guardadas son datos del cliente (`client-info`). */
  showContact: boolean;
}

function useRelationship(customerId: string) {
  const query = useCustomerRelationship(customerId);
  return { data: query.data, loading: query.isPending };
}

/**
 * Lo que el cliente tiene a su favor: cuánto le falta para la cortesía de la membresía, sus paquetes,
 * el saldo y las tarjetas de regalo que compró, y con qué tarjeta paga. Recepción lo pregunta cada día.
 */
export function CustomerWallet({ customerId, formatMoney, showMoney, showContact }: RelationshipProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { data, loading } = useRelationship(customerId);
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;
  const { membership } = data;
  const gifts = showMoney ? data.giftCards : [];
  const cards = showContact ? data.cards : [];
  const empty = !membership && data.packages.length === 0 && (!showMoney || data.credit === 0) && gifts.length === 0 && cards.length === 0;

  return (
    <InfoCard title={t("customers.rel.wallet")} description={t("customers.rel.walletHint")}>
      <div data-testid="customer-wallet">
        {membership && (
          <div className="flex items-center gap-4 border-b border-border/60 pb-3" data-testid="customer-membership">
            <ProgressRing
              value={membership.progress}
              max={membership.every}
              color="primary"
              aria-label={t("customers.rel.membershipAria", {
                progress: membership.progress,
                every: membership.every,
              })}
            >
              <span className="text-xs font-semibold tabular-nums">
                {membership.progress}/{membership.every}
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <Text weight="semibold">{t("customers.rel.membership")}</Text>
              <Text variant="muted">
                {membership.available > 0
                  ? t("customers.rel.membershipReady", {
                      count: membership.available,
                      reward: membership.reward,
                    })
                  : t("customers.rel.membershipLeft", {
                      count: membership.every - membership.progress,
                      reward: membership.reward,
                    })}
              </Text>
            </div>
            {membership.available > 0 && <Badge variant="positive">{t("customers.rel.courtesy")}</Badge>}
          </div>
        )}
        {data.packages.map((item) => (
          <InfoRow key={item.id} icon={<Package />} label={item.name}>
            {t("customers.rel.packageLeft", {
              count: item.remaining,
              total: item.total,
              service: item.service,
              date: formatDate(new Date(item.expiresAt), DAY),
            })}
          </InfoRow>
        ))}
        {showMoney && data.credit > 0 && (
          <InfoRow icon={<Wallet />} label={t("customers.rel.credit")}>
            <span className="tabular-nums" data-testid="customer-credit">
              {formatMoney(data.credit)}
            </span>
          </InfoRow>
        )}
        {gifts.map((card) => (
          <InfoRow key={card.code} icon={<Gift />} label={t("customers.rel.giftFor", { name: card.recipientName })}>
            {t("customers.rel.giftBalance", {
              balance: formatMoney(card.balance),
              initial: formatMoney(card.initial),
            })}
          </InfoRow>
        ))}
        {cards.map((card) => (
          <InfoRow key={card.id} icon={<CreditCard />} label={`${card.brand} ·· ${card.last4}`}>
            {t("customers.rel.cardExpires", {
              date: `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`,
            })}
          </InfoRow>
        ))}
        {empty && <Text variant="muted">{t("customers.rel.walletEmpty")}</Text>}
      </div>
    </InfoCard>
  );
}

/**
 * Lo que se le escribió y si acepta promociones (con fecha y origen, para poder probarlo), las
 * reseñas que dejó y los huecos que está esperando. Los mensajes de sus citas no piden permiso;
 * las promociones sí, y retirarlo es un clic.
 */
export function CustomerContactLog({ customerId }: { customerId: string }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const { data, loading } = useRelationship(customerId);
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  return (
    <InfoCard title={t("customers.rel.contact")} description={t("customers.rel.contactHint")}>
      <div className="space-y-4" data-testid="customer-contact-log">
        <MarketingConsentRow customerId={customerId} consent={data.consent.marketing} />
        <section aria-label={t("customers.rel.messages")} className="space-y-2">
          <Text variant="label">{t("customers.rel.messages")}</Text>
          {data.messages.length === 0 ? (
            <Text variant="muted">{t("customers.rel.messagesEmpty")}</Text>
          ) : (
            <ul className="space-y-1 text-sm" data-testid="customer-messages">
              {data.messages.map((message) => (
                <li key={message.id} className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <MessageCircle className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                    {t(MESSAGE_KIND_KEYS[message.kind])}
                  </span>
                  <span className={message.status === "failed" ? "text-xs text-status-warning" : "text-xs text-text-muted"} title={message.error ?? undefined}>
                    {t(message.status === "failed" ? "calendar.messages.status.failed" : message.simulated ? "calendar.messages.status.simulated" : "calendar.messages.status.sent")} · {formatDate(new Date(message.at), DAY_TIME)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {data.reviews.length > 0 && <ReviewList reviews={data.reviews} />}
        {data.waitlist.length > 0 && (
          <section aria-label={t("customers.rel.waitlist")} className="space-y-2" data-testid="customer-waitlist">
            <Text variant="label">{t("customers.rel.waitlist")}</Text>
            {data.waitlist.map((entry) => (
              <InfoRow key={entry.id} icon={<Hourglass />} label={`${entry.service} · ${entry.barber ?? t("customers.noPreference")}`}>
                {branchName(entry.branchId)} · {entry.slots.map((slot) => `${formatDate(new Date(`${slot.date}T12:00:00`), DAY)} ${slot.time}`).join(", ")}
              </InfoRow>
            ))}
          </section>
        )}
      </div>
    </InfoCard>
  );
}

function MarketingConsentRow({ customerId, consent }: { customerId: string; consent: CustomerRelationship["consent"]["marketing"] }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const setConsent = useSetMarketingConsent();
  const [asking, setAsking] = React.useState(false);
  // Lo que el equipo le dice al cliente antes de anotarlo depende del país de su sede (ver features/legal).
  const pack = useBranchConsentPack(useCustomerQuery(customerId).data?.branchId);
  const accepted = consent?.accepted === true;
  const save = (marketing: boolean) =>
    setConsent.mutate(
      { id: customerId, marketing },
      {
        onSuccess: () => {
          setAsking(false);
          toast.success(t(marketing ? "customers.rel.consentGranted" : "customers.rel.consentRevoked"));
        },
        onError: (error) =>
          toast.error(describeError(error).title, {
            description: describeError(error).description,
          }),
      }
    );
  const status = consent
    ? t(consent.accepted ? "customers.rel.consentYes" : "customers.rel.consentNo", {
        date: formatDate(new Date(consent.at), DAY),
        source: t(SOURCE_KEYS[consent.source]),
      }) + (consent.version ? ` · ${t("customers.rel.consentVersion", { version: consent.version })}` : "")
    : t("customers.rel.consentUnknown");
  const smsStop = useCustomerRelationship(customerId).data?.consent.smsStop;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-subtle px-3 py-2" data-testid="customer-consent">
      {accepted ? <BellRing className="size-4 text-status-positive" aria-hidden /> : <BellOff className="size-4 text-text-muted" aria-hidden />}
      <div className="min-w-0 flex-1">
        <Text weight="semibold">{t("customers.rel.consent")}</Text>
        <Text variant="muted">{status}</Text>
        {smsStop && (
          <Text variant="muted" className="text-status-warning" data-testid="customer-sms-stop">
            {t("customers.rel.smsStop", { date: formatDate(new Date(smsStop.at), DAY) })}
          </Text>
        )}
      </div>
      {accepted ? (
        <Button size="xs" variant="outline" onClick={() => save(false)} disabled={setConsent.isPending} data-testid="customer-consent-revoke">
          {t("customers.rel.consentRevoke")}
        </Button>
      ) : (
        <Button size="xs" variant="outline" onClick={() => setAsking(true)} data-testid="customer-consent-grant">
          {t("customers.rel.consentGrant")}
        </Button>
      )}
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={t("customers.rel.consentGrantTitle")}
        description={pack.staffScript}
        confirmLabel={t("customers.rel.consentGrantConfirm")}
        loading={setConsent.isPending}
        onConfirm={() => save(true)}
      />
    </div>
  );
}

function ReviewList({ reviews }: { reviews: CustomerRelationship["reviews"] }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  return (
    <section aria-label={t("customers.rel.reviews")} className="space-y-2" data-testid="customer-reviews">
      <Text variant="label">{t("customers.rel.reviews")}</Text>
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border/60 pb-2 last:border-b-0">
          <p className="flex items-center gap-2 text-sm">
            <span className="flex" role="img" aria-label={t("customers.rel.stars", { count: review.rating })}>
              {Array.from({ length: MAX_STARS }, (_, index) => (
                <Star key={index} className={index < review.rating ? "size-3.5 fill-primary text-primary" : "size-3.5 text-border"} aria-hidden />
              ))}
            </span>
            <span className="text-text-muted">
              {review.barber} · {formatDate(new Date(review.createdAt), DAY)}
            </span>
          </p>
          {review.comment && <Text variant="muted">{review.comment}</Text>}
        </div>
      ))}
    </section>
  );
}
