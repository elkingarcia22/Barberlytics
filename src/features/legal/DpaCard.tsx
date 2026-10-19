import { Link } from "react-router";
import { FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility";
import { useAccess } from "@/features/access/useAccess";
import { legalHref } from "./documents";
import { useAcceptDpa, useLegalAcceptances } from "./acceptances";

/**
 * El acuerdo de encargo de datos de la barbería: si se aceptó, quién, cuándo y qué versión; si hay una
 * nueva, se pide revisarla. Lo acepta el dueño o un administrador; cada aceptación guarda su versión.
 */
export function DpaCard() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const access = useAccess();
  const manager = access.role === "owner" || access.role === "admin";
  const query = useLegalAcceptances(manager);
  const accept = useAcceptDpa();
  const data = query.data;
  const accepted = data?.dpa ?? null;
  const upToDate = Boolean(accepted && data && accepted.version === data.current.dpa);

  return (
    <div className="space-y-3" data-testid="dpa-card">
      <div className="flex items-start gap-3">
        <IconTile icon={<FileCheck2 />} tone={upToDate ? "positive" : "warning"} />
        <div className="min-w-0 flex-1 space-y-1">
          <Text>{t("legal.dpa.hint")}</Text>
          <Text size="sm" tone={upToDate ? "muted" : "negative"} data-testid="dpa-status">
            {!manager
              ? t("legal.dpa.ownerOnly")
              : accepted && upToDate
                ? t("legal.dpa.accepted", { name: accepted.by, date: formatDate(new Date(accepted.at), { day: "numeric", month: "long", year: "numeric" }), version: accepted.version })
                : accepted && data
                  ? t("legal.dpa.outdated", { version: data.current.dpa })
                  : t("legal.dpa.pending")}
          </Text>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={legalHref("subprocessors")} target="_blank" rel="noreferrer">
            {t("legal.dpa.subprocessors")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={legalHref("dpa")} target="_blank" rel="noreferrer">
            {t("legal.dpa.read")}
          </Link>
        </Button>
        {manager && data && !upToDate && (
          <Button
            type="button"
            size="sm"
            disabled={accept.isPending}
            onClick={() => accept.mutate(data.current.dpa, { onSuccess: () => toast.success(t("legal.dpa.acceptedToast")), onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }) })}
            data-testid="dpa-accept"
          >
            {t("legal.dpa.accept")}
          </Button>
        )}
      </div>
    </div>
  );
}
