import { Link, useParams } from "react-router";
import { FileText, Info } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { PageShell } from "@/components/layout";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";
import { cn } from "@/lib/utils";
import { DRAFT_NOTICE, LEGAL_DOCS, legalDocBySlug, type LegalDoc, type LegalLocale } from "./documents";

/**
 * Los documentos legales, públicos (`/legal` y `/legal/<documento>`): términos, privacidad, la política de
 * tratamiento de Colombia, el acuerdo de encargo y los subencargados. Se leen sin entrar; cada uno dice su
 * versión y su fecha, y que es un borrador hasta que lo apruebe un abogado.
 */

function Paragraphs({ lines }: { lines: readonly string[] }) {
  const items: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length === 0) return;
    items.push(
      <ul key={`ul-${items.length}`} className="list-disc space-y-1.5 pl-5 text-text-secondary">
        {bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    );
    bullets = [];
  };
  for (const line of lines) {
    if (line.startsWith("- ")) bullets.push(line.slice(2));
    else {
      flush();
      items.push(
        <Text key={line} tone="secondary">
          {line}
        </Text>
      );
    }
  }
  flush();
  return <div className="space-y-3">{items}</div>;
}

function Document({ doc, locale }: { doc: LegalDoc; locale: LegalLocale }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const shown: LegalLocale = doc.spanishOnly ? "es" : locale;
  return (
    <article className="min-w-0 space-y-8" data-testid="legal-document" aria-labelledby="legal-title">
      <header className="space-y-3">
        <Heading level={1} id="legal-title">
          {doc.title[locale]}
        </Heading>
        <Text size="lg" tone="secondary">
          {doc.summary[locale]}
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("legal.version", { version: doc.version })}</Badge>
          <Text as="span" size="sm" tone="muted">
            {t("legal.updated", { date: formatDate(new Date(`${doc.updatedAt}T12:00:00`), { day: "numeric", month: "long", year: "numeric" }) })}
          </Text>
          <Text as="span" size="sm" tone="muted">
            · {doc.audience[locale]}
          </Text>
        </div>
        <Alert data-testid="legal-draft">
          <Info aria-hidden />
          <AlertDescription>{DRAFT_NOTICE[locale]}</AlertDescription>
        </Alert>
        {doc.spanishOnly && locale !== "es" && (
          <Text size="sm" tone="muted">
            {t("legal.spanishOnly")}
          </Text>
        )}
      </header>
      {doc.sections.length > 1 && (
        <nav aria-label={t("legal.contents")} className="rounded-xl border border-border p-4">
          <Text as="p" size="sm" weight="medium" className="mb-2">
            {t("legal.contents")}
          </Text>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-primary underline-offset-2 hover:underline">
                  {section.title[shown]}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {doc.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-6 space-y-3">
          <Heading level={3} id={`${section.id}-title`}>
            {section.title[shown]}
          </Heading>
          <Paragraphs lines={section.body[shown]} />
        </section>
      ))}
    </article>
  );
}

export function LegalPage() {
  const t = useAppT();
  const { locale } = useLocale();
  const { slug } = useParams();
  const lang: LegalLocale = locale === "en" ? "en" : "es";
  const doc = legalDocBySlug(slug);

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Link to="/legal" aria-label={t("legal.title")} className="inline-flex items-center gap-3">
          <BarberlyticsLogo height={24} />
          <Text as="span" tone="muted">
            {t("legal.title")}
          </Text>
        </Link>
      </header>
      <PageShell maxWidth="normal">
        <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t("legal.documents")} className="lg:sticky lg:top-6 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {LEGAL_DOCS.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/legal/${item.slug}`}
                  aria-current={item.slug === slug ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-subtle",
                    item.slug === slug ? "bg-surface-subtle font-medium text-text-primary" : "text-text-secondary"
                  )}
                >
                  <FileText className="size-4 shrink-0" aria-hidden />
                  {item.title[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {doc ? (
          <Document doc={doc} locale={lang} />
        ) : (
          <div className="space-y-4" data-testid="legal-index">
            <Heading level={1}>{t("legal.title")}</Heading>
            <Text tone="secondary">{t("legal.lead")}</Text>
            <ul className="grid gap-3 sm:grid-cols-2">
              {LEGAL_DOCS.map((item) => (
                <li key={item.id}>
                  <Link to={`/legal/${item.slug}`} className="flex h-full flex-col gap-1 rounded-xl border border-input p-4 transition-colors hover:border-primary/50">
                    <Text as="span" weight="medium">
                      {item.title[lang]}
                    </Text>
                    <Text as="span" size="sm" tone="muted">
                      {item.summary[lang]}
                    </Text>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </PageShell>
    </div>
  );
}
