import * as React from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeBlock, CopyButton } from "./CodeBlock";
import { PreviewFrame } from "./PreviewFrame";
import { Knobs } from "./Knobs";
import { defaultValues } from "./knobValues";
import { PropsTable } from "./PropsTable";
import { DOC_GROUPS, type ControlValue, type DocEntry, type DocExample, type DocPlayground } from "../registry/types";
import { findEntry } from "../registry";
import { routeToHash } from "../router";
import { useLocalizer, useT } from "@/i18n";

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
    // La card del sistema ya trae borde, radio y sombra; aquí solo se le pide
    // recortar las esquinas del lienzo y del bloque de código que lleva pegados.
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[minmax(0,1fr)_240px]">
        <PreviewFrame layout={playground.layout} className="min-h-[260px] rounded-none border-0 border-b border-border/60 md:border-b-0 md:border-r">
          {playground.render(typed)}
        </PreviewFrame>
        <aside className="flex flex-col gap-stack bg-surface p-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Controles</p>
          <Knobs controls={playground.controls} values={values} onChange={onChange} />
        </aside>
      </div>
      <CodeBlock code={playground.code(typed)} className="rounded-none border-0 border-t border-border/60" />
    </Card>
  );
}

function Example({ example }: { example: DocExample }) {
  const [showCode, setShowCode] = React.useState(false);
  return (
    <article id={`example-${example.id}`} className="scroll-mt-24 space-y-stack">
      <div className="flex flex-wrap items-baseline justify-between gap-inline">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{example.title}</h3>
          {example.description && <p className="mt-0.5 text-[13px] text-text-secondary">{example.description}</p>}
        </div>
        {/* `px-0` para que el enlace quede a ras del borde del ejemplo, como antes. */}
        <Button type="button" variant="link" size="sm" className="px-0" onClick={() => setShowCode((value) => !value)}>
          {showCode ? "Ocultar código" : "Ver código"}
        </Button>
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

  const tr = useLocalizer();
  const t = useT();

  return (
    <div className="cascade-enter space-y-section" key={entry.id}>
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-inline">
          {group && (
            <a href={routeToHash({ kind: "group", id: group.id })} className="text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">
              {tr(group.label)}
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
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-secondary">{tr(entry.description)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-inline">
          {/* Sigue siendo un <code> y no un <Badge>: es la ruta de import, código
              en línea, no una etiqueta de estado. Un Badge mide h-5 y recorta. */}
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
          <SectionTitle id="playground">{t("docs.playground")}</SectionTitle>
          <Playground playground={entry.playground} />
        </section>
      )}

      {entry.guidelines && (entry.guidelines.do?.length || entry.guidelines.dont?.length) ? (
        <section className="space-y-4">
          <SectionTitle id="guidelines">{t("docs.guidelines")}</SectionTitle>
          {/* Las dos listas se quedan como <ul> con color de estado y no pasan a
              <Alert>: Alert es un `role="alert"` —una región viva que el lector
              de pantalla anuncia— y esto es guía estática, no un aviso. Lo que
              sí adoptan es el padding y el ritmo del sistema. */}
          <div className="grid gap-4 md:grid-cols-2">
            {entry.guidelines.do && entry.guidelines.do.length > 0 && (
              <ul className="space-y-stack rounded-xl border border-status-positive/30 bg-status-positive/5 p-card">
                {entry.guidelines.do.map((item) => (
                  <li key={item} className="flex gap-inline text-[13px] text-text-secondary">
                    <Check className="mt-0.5 size-4 shrink-0 text-status-positive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {entry.guidelines.dont && entry.guidelines.dont.length > 0 && (
              <ul className="space-y-stack rounded-xl border border-status-negative/30 bg-status-negative/5 p-card">
                {entry.guidelines.dont.map((item) => (
                  <li key={item} className="flex gap-inline text-[13px] text-text-secondary">
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
          <SectionTitle id="examples">{t("docs.examples")}</SectionTitle>
          <div className="space-y-8">
            {entry.examples.map((example) => (
              <Example key={example.id} example={example} />
            ))}
          </div>
        </section>
      )}

      {entry.props && entry.props.length > 0 && (
        <section className="space-y-4">
          <SectionTitle id="props">{t("docs.props")}</SectionTitle>
          <PropsTable props={entry.props} />
        </section>
      )}

      {related.length > 0 && (
        <>
          <Separator />
          <section className="space-y-stack">
            <SectionTitle id="related">{t("docs.related")}</SectionTitle>
            <div className="flex flex-wrap gap-inline">
              {related.map((item) => (
                // Enlaces de navegación con forma de botón: el <Button> del
                // sistema con `asChild` ya trae el hover y el foco diseñados.
                <Button key={item.id} asChild variant="outline" size="sm">
                  <a href={routeToHash({ kind: "component", id: item.id })}>{item.name}</a>
                </Button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
