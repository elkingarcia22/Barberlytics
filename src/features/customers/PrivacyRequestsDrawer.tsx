import * as React from "react";
import { useAppT } from "@/app/i18n";
import { ThemaTabs } from "@/components/navigation";
import { DrawerShell } from "@/components/overlays";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { RequestItem } from "./CustomerPrivacy";
import { usePrivacyRequests } from "./privacy";

/**
 * Todas las solicitudes de datos de la barbería, las abiertas primero: qué pidió cada cliente y hasta
 * cuándo hay para responder (las vencidas se marcan). Recepción las ve; cerrarlas es de gerencia.
 */
export function PrivacyRequestsDrawer({ open, onOpenChange, canClose }: { open: boolean; onOpenChange: (open: boolean) => void; canClose: boolean }) {
  const t = useAppT();
  const [view, setView] = React.useState<"open" | "all">("open");
  const query = usePrivacyRequests(view === "open" ? { status: "open" } : {}, open);
  const items = query.data?.items ?? [];
  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="lg" title={t("customers.privacy.requestsTitle")} description={t("customers.privacy.requestsHint")}>
      <div className="space-y-4" data-testid="privacy-requests-drawer">
        <ThemaTabs
          className="mb-0"
          fitContent
          tabs={[
            { id: "open", label: t("customers.privacy.requestsOpen"), badge: query.data?.open },
            { id: "all", label: t("customers.privacy.requestsAll") },
          ]}
          activeTabId={view}
          onTabChange={(id) => setView(id as "open" | "all")}
        />
        {query.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : items.length === 0 ? (
          <Text variant="muted">{t(view === "open" ? "customers.privacy.requestsNoneOpen" : "customers.privacy.requestsEmpty")}</Text>
        ) : (
          <ul className="space-y-2">
            {items.map((request) => (
              <RequestItem key={request.id} request={request} canClose={canClose} showClient />
            ))}
          </ul>
        )}
      </div>
    </DrawerShell>
  );
}
