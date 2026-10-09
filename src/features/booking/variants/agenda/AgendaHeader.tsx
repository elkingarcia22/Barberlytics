import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../../flow/BookingContext";
import { ChatTrigger } from "../../flow/ChatTrigger";
import { ShopBrand } from "../../flow/ShopBrand";

interface AgendaHeaderProps {
  onBack: (() => void) | null;
  onSignIn: () => void;
  trailing?: React.ReactNode;
  /** «Agenda con Clipper» solo en la primera pantalla (la agenda), no ya en el cierre. */
  showChat?: boolean;
}

/**
 * La cabecera de la agenda: la barbería y su sede, entrar como cliente (no hace
 * falta para mirar horas), «Mis citas» y lo que se compra aparte (regalos y
 * paquetes). No cuenta pasos: aquí no hay pasos.
 */
export function AgendaHeader({ onBack, onSignIn, trailing, showChat = false }: AgendaHeaderProps) {
  const t = useAppT();
  const { shop, state, dispatch, layout, touch } = useBookingFlow();
  const isWide = layout === "wide";
  const extras = [
    ...(shop.payment.card ? [{ id: "gift" as const, label: t("booking.gift.cta") }] : []),
    ...(shop.packages.length > 0 ? [{ id: "packages" as const, label: t("booking.packages.cta") }] : []),
  ];

  return (
    <header className="relative z-sticky shrink-0 border-b border-border bg-surface/90 backdrop-blur">
      <div className={cn("flex h-14 items-center gap-2 px-3", isWide && "h-16 px-6")}>
        {onBack && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("booking.header.back")}>
            <ThemaIcon name="chevronLeft" />
          </Button>
        )}
        <div className="flex min-w-0 flex-1 items-center">
          {/* Solo la marca (en celular, solo el logo): la sede ya se ve y se cambia en su campo. */}
          <ShopBrand shop={shop} iconOnly={!isWide && touch !== "lg"} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showChat && <ChatTrigger full />}
          {/* Sin entrar, «Entrar»; ya dentro, en su lugar «Mis citas». */}
          {state.customer ? (
            <>
              <Text size="sm" weight="medium" className={cn("px-2", !isWide && "sr-only")}>
                {t("booking.agenda.signedAs", { name: state.customer.firstName })}
              </Text>
              {state.step !== "manage" && (
                <Button type="button" variant="outline" size={isWide ? "sm" : "icon-sm"} onClick={() => dispatch({ type: "openManage" })} aria-label={t("booking.header.myAppointments")}>
                  <ThemaIcon name="calendar" />
                  {isWide && t("booking.header.myAppointments")}
                </Button>
              )}
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onSignIn}>
              <ThemaIcon name="login" />
              {isWide ? t("booking.agenda.signIn") : t("booking.agenda.signInShort")}
            </Button>
          )}
          {state.customer && extras.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={t("booking.agenda.more")}>
                  <ThemaIcon name="more" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {extras.map((item) => (
                  <DropdownMenuItem key={item.id} onSelect={() => dispatch({ type: "goTo", step: item.id })} className="gap-2">
                    <ThemaIcon name="ticket" size="xs" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {trailing}
        </div>
      </div>
    </header>
  );
}
