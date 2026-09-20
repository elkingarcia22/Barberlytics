import * as React from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeBlock, CopyButton } from "./CodeBlock";
import { PreviewFrame } from "./PreviewFrame";
import { Knobs, defaultValues } from "./Knobs";
import { PropsTable } from "./PropsTable";
import { DOC_GROUPS, type ControlValue, type DocEntry, type DocExample, type DocPlayground } from "../registry/types";
import { findEntry } from "../registry";
import { routeToHash } from "../router";

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-base font-semibold tracking-tight text-text-primary">
      {children}
    </h2>
  );
}

function Playground({ playground }: { playground: DocPlayground }) {
  const [values, setValues] = React.useState<Record<string, ControlValue>>(() => defaultValues(playground.controls));
  const onChange = (key: string, value: ControlValue) => setValues((prev) => ({ ...prev, [key]: value }));
  const typed = values as Parameters<typeof playground.render>[0];
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="grid md:grid-cols-[minmax(0,1fr)_240px]">
        <PreviewFrame layout={playground.layout} className="min-h-[260px] rounded-none border-0 border-b border-border/60 md:border-b-0 md:border-r">
          {playground.render(typed)}
        </PreviewFrame>
        <aside className="bg-surface p-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Controles</p>
          <Knobs controls={playground.controls} values={values} onChange={onChange} />
        </aside>
      </div>
      <CodeBlock code={playground.code(typed)} className="rounded-none border-0 border-t border-border/60" />
    </div>
  );
}

function Example({ example }: { example: DocExample }) {
  const [showCode, setShowCode] = React.useState(false);
  return (
    <article id={`example-${example.id}`} className="scroll-mt-24 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{example.title}</h3>
          {example.description && <p className="mt-0.5 text-[13px] text-text-secondary">{example.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowCode((value) => !value)}
          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
        >
          {showCode ? "Ocultar código" : "Ver código"}
        </button>
      </div>
      <PreviewFrame layout={example.layout} className={example.frameClassName}>
        {example.render()}
      </PreviewFrame>
      {showCode && <CodeBlock code={example.code} />}
    </article>
  );
}

const STATUS_LABEL: Record<NonNullable<DocEntry["status"]>, string> = {
  stable: "Estable",
  beta: "Beta",
  legacy: "Legacy",
};

export function ComponentPage({ entry }: { entry: DocEntry }) {
  const group = DOC_GROUPS.find((item) => item.id === entry.group);
  const related = (entry.related ?? []).map(findEntry).filter((item): item is DocEntry => Boolean(item));

  return (
    <div className="cascade-enter space-y-10" key={entry.id}>
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {group && (
            <a href={routeToHash({ kind: "group", id: group.id })} className="text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">
              {group.label}
            </a>
          )}
          {entry.status && entry.status !== "stable" && (
            <Badge variant={entry.status === "legacy" ? "neutral" : "secondary"}>{STATUS_LABEL[entry.status]}</Badge>
          )}
          {entry.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">{entry.name}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-secondary">{entry.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-md border border-border/60 bg-surface-subtle px-2.5 py-1.5 font-mono text-xs text-text-primary">{entry.importPath}</code>
          <CopyButton text={entry.importPath} />
          {entry.sourcePath && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <ExternalLink className="size-3" />
              {entry.sourcePath}
            </span>
          )}
        </div>
      </header>

      {entry.playground && (
        <section className="space-y-4">
          <SectionTitle id="playground">Playground</SectionTitle>
          <Playground playground={entry.playground} />
        </section>
      )}

      {entry.guidelines && (entry.guidelines.do?.length || entry.guidelines.dont?.length) ? (
        <section className="space-y-4">
          <SectionTitle id="guidelines">Cuándo usarlo</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {entry.guidelines.do && entry.guidelines.do.length > 0 && (
              <ul className="space-y-2 rounded-xl border border-status-positive/30 bg-status-positive/5 p-4">
                {entry.guidelines.do.map((item) => (
                  <li key={item} className="flex gap-2 text-[13px] text-text-secondary">
                    <Check className="mt-0.5 size-4 shrink-0 text-status-positive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {entry.guidelines.dont && entry.guidelines.dont.length > 0 && (
              <ul className="space-y-2 rounded-xl border border-status-negative/30 bg-status-negative/5 p-4">
                {entry.guidelines.dont.map((item) => (
                  <li key={item} className="flex gap-2 text-[13px] text-text-secondary">
                    <X className="mt-0.5 size-4 shrink-0 text-status-negative" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {entry.examples.length > 0 && (
        <section className="space-y-6">
          <SectionTitle id="examples">Ejemplos</SectionTitle>
          <div className="space-y-8">
            {entry.examples.map((example) => (
              <Example key={example.id} example={example} />
            ))}
          </div>
        </section>
      )}

      {entry.props && entry.props.length > 0 && (
        <section className="space-y-4">
          <SectionTitle id="props">Props</SectionTitle>
          <PropsTable props={entry.props} />
        </section>
      )}

      {related.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <SectionTitle id="related">Relacionados</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {related.map((item) => (
                <a
                  key={item.id}
                  href={routeToHash({ kind: "component", id: item.id })}
                  className={cn(
                    "rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
