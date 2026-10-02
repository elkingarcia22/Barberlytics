import { Clock, FileText } from "lucide-react";
import { ListItem } from "@/components/data-display/ListItem";
import { Tag } from "@/components/utility";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n";
import type { HelpArticleMeta, HelpRole, HelpStatus } from "@/lib/help";

const ROLE_KEYS: Record<HelpRole, AppMessageKey> = {
  owner: "help.role.owner",
  admin: "help.role.admin",
  recepcion: "help.role.recepcion",
  barbero: "help.role.barbero",
  todos: "help.role.todos",
};

/** Los chips de «para quién es» de un artículo. */
export function RoleTags({ roles }: { roles: readonly HelpRole[] }) {
  const t = useAppT();
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Tag key={role} label={t(ROLE_KEYS[role])} tone={role === "todos" ? "neutral" : "info"} />
      ))}
    </span>
  );
}

/** El chip de estado, solo cuando el artículo aún no está publicado. */
export function StatusTag({ status }: { status: HelpStatus }) {
  const t = useAppT();
  if (status === "published") return null;
  return <Tag label={t(status === "draft" ? "help.status.draft" : "help.status.review")} tone="warning" />;
}

interface ArticleRowProps {
  article: HelpArticleMeta;
  onOpen: (id: string) => void;
  /** Un fragmento del cuerpo, en los resultados de búsqueda. */
  snippet?: string;
}

/** Una fila de artículo en una lista: título, descripción y minutos. */
export function ArticleRow({ article, onOpen, snippet }: ArticleRowProps) {
  const t = useAppT();
  return (
    <ListItem
      leading={<FileText className="size-4 shrink-0 text-text-muted" />}
      title={article.title}
      description={snippet ?? article.description}
      meta={
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-text-muted">
          <Clock className="size-3.5" />
          {t("help.readingMinutes", { count: article.readingMinutes })}
        </span>
      }
      onClick={() => onOpen(article.id)}
    />
  );
}
