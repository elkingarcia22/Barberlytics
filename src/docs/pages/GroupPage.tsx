import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { entriesByGroup, type DocGroup } from "../registry";
import { routeToHash } from "../router";
import { useLocalizer, useT } from "@/i18n";

export function GroupPage({ group }: { group: DocGroup }) {
  const entries = entriesByGroup(group.id);
  const tr = useLocalizer();
  const t = useT();
  return (
    <div className="cascade-enter space-y-8" key={group.id}>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("docs.components")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">{tr(group.label)}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-text-secondary">{tr(group.description)}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <a key={entry.id} href={routeToHash({ kind: "component", id: entry.id })} className="group block">
            {/* La superficie es una <Card>; el enlace la envuelve porque Card
                siempre renderiza un div y aquí hace falta navegar. */}
            <Card className="magic-card-sweep magic-card-lift relative overflow-hidden p-card transition-colors group-hover:border-primary/40">
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-text-primary">{entry.name}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{tr(entry.description)}</p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="relative z-10 mt-3 flex flex-wrap gap-inline">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="neutral" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </a>
        ))}
        {entries.length === 0 && <p className="text-sm text-text-muted">Este grupo todavía no tiene entradas documentadas.</p>}
      </div>
    </div>
  );
}
