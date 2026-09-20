import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { entriesByGroup, type DocGroup } from "../registry";
import { routeToHash } from "../router";

export function GroupPage({ group }: { group: DocGroup }) {
  const entries = entriesByGroup(group.id);
  return (
    <div className="cascade-enter space-y-8" key={group.id}>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Componentes</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">{group.label}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-text-secondary">{group.description}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <a
            key={entry.id}
            href={routeToHash({ kind: "component", id: entry.id })}
            className="group magic-card-sweep magic-card-lift relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-card transition-colors hover:border-primary/40"
          >
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">{entry.name}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{entry.description}</p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="neutral" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </a>
        ))}
        {entries.length === 0 && <p className="text-sm text-text-muted">Este grupo todavía no tiene entradas documentadas.</p>}
      </div>
    </div>
  );
}
