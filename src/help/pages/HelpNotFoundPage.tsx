import { useNavigate } from "react-router";
import { FileQuestion } from "lucide-react";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { HelpPage } from "../HelpPage";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useAppT } from "@/app/i18n";
import { helpPath } from "../content";
import { HelpSearchBox } from "../HelpSearchBox";

/** Una ruta de ayuda que no existe: buscador y vuelta al inicio. */
export function HelpNotFoundPage() {
  const t = useAppT();
  const navigate = useNavigate();
  return (
    <HelpPage narrow>
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("help.title"), onClick: () => navigate(helpPath()) }, t("help.notFound")]} />
      </ShellHeaderSlot>
      <EmptyState
        icon={FileQuestion}
        title={t("help.notFound")}
        description={t("help.notFoundHint")}
        action={
          <Button type="button" onClick={() => navigate(helpPath())}>
            {t("help.backHome")}
          </Button>
        }
      />
      <HelpSearchBox />
    </HelpPage>
  );
}
