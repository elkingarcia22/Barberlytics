import { splitHighlights } from "@/lib/help";

interface HighlightProps {
  text: string;
  /** Los términos que coincidieron, ya sin tildes (los devuelve la búsqueda). */
  terms: readonly string[];
}

/** Un texto con las coincidencias de la búsqueda marcadas. */
export function Highlight({ text, terms }: HighlightProps) {
  return (
    <>
      {splitHighlights(text, terms).map((part, index) =>
        part.hit ? (
          <mark key={index} className="rounded-xs bg-primary/15 px-0.5 font-semibold text-text-primary">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}
