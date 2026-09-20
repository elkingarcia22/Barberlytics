import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function useCopy(timeout = 1600) {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeout);
      } catch {
        setCopied(false);
      }
    },
    [timeout]
  );
  return { copied, copy };
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={copied ? "Copiado" : "Copiar código"}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-surface px-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-border-strong/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
    >
      {copied ? <Check className="size-3.5 text-status-positive" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** Oculta el botón de copiar. */
  bare?: boolean;
}

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
