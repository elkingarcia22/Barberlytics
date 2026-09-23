import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useCopy } from "../hooks/useCopy";

/** Resalta de forma ligera JSX/TS: cadenas, etiquetas, palabras clave y comentarios. */
function highlight(code: string): React.ReactNode[] {
  const pattern =
    /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*)|(\b(?:import|export|from|const|let|var|function|return|default|type|interface|as|async|await|new|if|else|true|false|null|undefined)\b)|(\{|\})/gm;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(code.slice(last, index));
    const [text, comment, string, tag, keyword] = match;
    const className = comment
      ? "text-text-muted italic"
      : string
        ? "text-status-positive"
        : tag
          ? "text-primary"
          : keyword
            ? "text-status-warning"
            : "text-text-secondary";
    nodes.push(
      <span key={key++} className={className}>
        {text}
      </span>
    );
    last = index + text.length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy();
  const t = useT();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => copy(text)}
      aria-label={copied ? t("docs.copied") : t("docs.copy")}
      className={className}
    >
      {copied ? <Check className="text-status-positive" /> : <Copy />}
      {copied ? t("docs.copied") : t("docs.copy")}
    </Button>
  );
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** Oculta el botón de copiar. */
  bare?: boolean;
}

/**
 * El marco del bloque de código es un `div` y no una `<Card>` a propósito, por
 * el mismo motivo que los estados de `ChartShell`: casi siempre se renderiza
 * *dentro* de una card —al pie del playground— y una Card anidada duplicaría
 * borde, radio y sombra. Aquí hace falta lo contrario: una superficie apagada
 * (`bg-surface-subtle`) que se distinga de la card que la contiene.
 */
export function CodeBlock({ code, language = "tsx", className, bare = false }: CodeBlockProps) {
  const trimmed = code.trim();
  return (
    <div className={cn("group/code relative overflow-hidden rounded-xl border border-border/60 bg-surface-subtle", className)}>
      {!bare && (
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">{language}</span>
          <CopyButton text={trimmed} />
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        <code className="font-mono text-text-primary">{highlight(trimmed)}</code>
      </pre>
    </div>
  );
}
