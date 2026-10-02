import * as React from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Kbd } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { slugify, type HelpHeading } from "@/lib/help";
import { Figure } from "./Figure";

/** Lo mínimo del árbol HTML que da react-markdown, para leer texto y tipo. */
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
}

/** Los componentes reciben `node` (el árbol) y no debe llegar al DOM. */
function withoutNode<T extends object>(props: T): Omit<T, "node"> {
  const rest: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  delete rest.node;
  return rest as Omit<T, "node">;
}

/** Un párrafo que solo trae imágenes: sin `<p>`, porque una figura no cabe dentro. */
function isFigureParagraph(node: HastNode | undefined): boolean {
  const meaningful = (node?.children ?? []).filter((child) => !(child.type === "text" && !(child.value ?? "").trim()));
  return meaningful.length > 0 && meaningful.every((child) => child.type === "element" && child.tagName === "img");
}

function hastText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

type AlertKind = "note" | "tip" | "warning" | "important";

const ALERT_MARKER = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

const ALERT_STYLE: Record<AlertKind, { variant: "info" | "success" | "warning" | "destructive"; icon: React.ReactNode }> = {
  note: { variant: "info", icon: <Info /> },
  tip: { variant: "success", icon: <Lightbulb /> },
  warning: { variant: "warning", icon: <AlertTriangle /> },
  important: { variant: "destructive", icon: <AlertCircle /> },
};

function alertKind(node: HastNode | undefined): AlertKind | null {
  const first = node?.children?.find((child) => child.type === "element" && child.tagName === "p");
  const match = ALERT_MARKER.exec(hastText(first));
  if (!match) return null;
  const kind = match[1].toLowerCase();
  return kind === "caution" ? "important" : (kind as AlertKind);
}

/** Una tecla se escribe como código corto: `⌘K`, `Enter`, `Ctrl+S`. */
const KEY_PATTERN = /^(?:[⌘⌥⇧⌃↑↓←→⏎]|ctrl|alt|shift|cmd|enter|esc|tab|supr|intro|f\d{1,2})/i;
function looksLikeKey(text: string): boolean {
  return text.length <= 12 && !text.includes("\n") && KEY_PATTERN.test(text);
}

interface HelpMarkdownProps {
  body: string;
  /** Los encabezados que ya calculó el generador, para que los anclas coincidan. */
  headings?: readonly HelpHeading[];
  className?: string;
}

/**
 * Markdown → piezas del sistema. Los avisos `> [!TIP]` se vuelven `Alert`,
 * las imágenes `Figure`, las tablas la `Table` del sistema, las teclas `Kbd`
 * y los enlaces internos `Link`. El resto se viste con `help.css`.
 */
export function HelpMarkdown({ body, headings, className }: HelpMarkdownProps) {
  const headingIds = React.useMemo(() => new Map((headings ?? []).map((heading) => [heading.text, heading.id])), [headings]);

  const components = React.useMemo<Components>(() => {
    const idFor = (node: HastNode | undefined) => {
      const text = hastText(node).trim();
      return headingIds.get(text) ?? slugify(text);
    };
    return {
      h1: ({ node, ...props }) => <h2 id={idFor(node as HastNode)} {...props} />,
      h2: ({ node, ...props }) => <h2 id={idFor(node as HastNode)} {...props} />,
      h3: ({ node, ...props }) => <h3 id={idFor(node as HastNode)} {...props} />,
      p: ({ node, children, ...props }) => {
        if (isFigureParagraph(node as HastNode)) return <>{children}</>;
        const parts = React.Children.toArray(children);
        const first = parts[0];
        if (typeof first === "string") {
          const match = ALERT_MARKER.exec(first);
          if (match) {
            const rest = first.slice(match[0].length);
            if (!rest && parts.length === 1) return null;
            parts[0] = rest;
          }
        }
        return <p {...props}>{parts}</p>;
      },
      blockquote: ({ node, children, ...props }) => {
        const kind = alertKind(node as HastNode);
        if (!kind) return <blockquote {...props}>{children}</blockquote>;
        const style = ALERT_STYLE[kind];
        return (
          <Alert variant={style.variant}>
            {style.icon}
            <AlertDescription className="text-current [&_p]:text-current">{children}</AlertDescription>
          </Alert>
        );
      },
      a: (allProps) => {
        const { href = "", children, ...props } = withoutNode(allProps);
        if (href.startsWith("/ayuda")) {
          return (
            <Link to={href} {...props}>
              {children}
            </Link>
          );
        }
        if (href.startsWith("#") || href.startsWith("/")) {
          return (
            <a href={href} {...props}>
              {children}
            </a>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer" {...props}>
            {children}
          </a>
        );
      },
      img: ({ src, alt }) => <Figure src={typeof src === "string" ? src : ""} alt={alt ?? ""} />,
      code: (allProps) => {
        const { className: codeClass, children, ...props } = withoutNode(allProps);
        const text = String(children ?? "");
        const isBlock = Boolean(codeClass) || text.includes("\n");
        if (!isBlock && looksLikeKey(text)) return <Kbd>{text}</Kbd>;
        return (
          <code className={codeClass} {...props}>
            {children}
          </code>
        );
      },
      table: ({ children }) => (
        <div className="help-table">
          <Table>{children}</Table>
        </div>
      ),
      thead: ({ children }) => <TableHeader>{children}</TableHeader>,
      tbody: ({ children }) => <TableBody>{children}</TableBody>,
      tr: ({ children }) => <TableRow>{children}</TableRow>,
      th: ({ children }) => <TableHead>{children}</TableHead>,
      td: ({ children }) => <TableCell>{children}</TableCell>,
    };
  }, [headingIds]);

  return (
    <div className={className ? `help-prose ${className}` : "help-prose"}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </Markdown>
    </div>
  );
}
