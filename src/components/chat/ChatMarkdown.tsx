import * as React from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import "./chat.css";

export interface ChatMarkdownProps {
  text: string;
  /** Enlaces internos (`/ayuda/...`): la app decide cómo navegar. Sin esto abren como enlaces normales. */
  onNavigate?: (href: string) => void;
  className?: string;
}

/** Los componentes reciben `node` (el árbol) y no debe llegar al DOM. */
function withoutNode<T extends object>(props: T): Omit<T, "node"> {
  const rest: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  delete rest.node;
  return rest as Omit<T, "node">;
}

function isInternal(href: string | undefined): href is string {
  return Boolean(href && href.startsWith("/") && !href.startsWith("//"));
}

/**
 * El Markdown ligero de una respuesta: negritas, listas, enlaces y código.
 * Sin títulos ni tablas: una respuesta es un mensaje, no un documento.
 */
export function ChatMarkdown({ text, onNavigate, className }: ChatMarkdownProps) {
  const components = React.useMemo<Components>(
    () => ({
      a: ({ href, children, ...props }) => {
        const rest = withoutNode(props);
        if (isInternal(href) && onNavigate) {
          return (
            <a
              href={href}
              {...rest}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(href);
              }}
            >
              {children}
            </a>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer" {...rest}>
            {children}
          </a>
        );
      },
      // Un mensaje no lleva títulos: si el texto los trae, se leen como negrita.
      h1: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
      h2: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
      h3: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
      img: () => null,
    }),
    [onNavigate]
  );
  return (
    <div className={cn("chat-prose text-sm leading-relaxed text-text-secondary", className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </Markdown>
    </div>
  );
}
