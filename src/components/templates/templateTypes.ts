import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tone";

/**
 * El contrato del catálogo de plantillas y las dos medidas que se calculan
 * sobre él.
 *
 * Una plantilla, aquí, es un punto de partida con nombre: un icono, un tono,
 * para qué sirve y **las líneas que trae escritas**. Qué sea cada línea lo
 * decide quien use el componente —un objetivo, una pregunta de encuesta, un
 * módulo de un curso—; el sistema solo sabe que tiene un nombre y un peso, y
 * que ese peso es lo que dibuja la miniatura. Así la misma ficha sirve para
 * cualquier catálogo sin que el sistema aprenda el dominio de nadie.
 */

export interface TemplateItem {
  /** Lo que la línea dice — el nombre que se lee en la ficha del catálogo. */
  label: string;
  /**
   * Cuánto pesa dentro de la plantilla. La escala la elige quien la escribe
   * (porcentaje, puntos, horas): la miniatura dibuja las barras en proporción
   * al mayor peso de la lista, no sobre un total fijo.
   */
  weight: number;
  /** Una línea de detalle bajo el nombre, solo en la ficha. */
  hint?: string;
}

export interface TemplateDefinition {
  id: string;
  /** El nombre corto, para la ficha compacta de una estantería. */
  label: string;
  /** El nombre completo, para la galería y el detalle. */
  name: string;
  /** Para qué sirve, en una línea. */
  description: string;
  /** La medida ya escrita — «3 elementos · Trimestre». La compone quien tiene
   *  el dato: el sistema no sabe contar lo que no es suyo. */
  meta: string;
  icon: LucideIcon;
  tone: Tone;
  /** Las líneas que la plantilla trae escritas. */
  items: readonly TemplateItem[];
  /**
   * La que el catálogo promueve arriba del todo.
   *
   * Existe para que una rejilla de fichas iguales no deje la primera decisión
   * entera en manos de quien mira. `pitch` es el argumento que solo se usa
   * ahí —por qué empezar por esta—, distinto de `description`.
   */
  featured?: boolean;
  pitch?: string;
}

export interface TemplateGroup {
  id: string;
  /** El título del estante. */
  label: string;
  /** Una línea sobre lo que guarda. */
  description?: string;
  /** El distintivo del estante; no es el icono de ninguna de sus plantillas. */
  icon?: LucideIcon;
  templates: readonly TemplateDefinition[];
}

/** El peso mínimo que dibuja la miniatura, para que una línea liviana siga
 *  viéndose en vez de desaparecer contra el fondo. */
const MIN_BAR = 0.25;

/**
 * Los pesos de las primeras `lines` líneas, normalizados entre 0 y 1 contra el
 * mayor de ellas — la barra más larga de la miniatura es siempre la línea que
 * más pesa, sin que el componente tenga que saber la escala.
 */
export function templateThumbWeights(
  items: readonly TemplateItem[],
  lines: number
): readonly number[] {
  const visible = items.slice(0, lines);
  const max = Math.max(...visible.map((item) => item.weight), 0);
  if (max <= 0) return visible.map(() => MIN_BAR);
  return visible.map((item) => Math.max(item.weight / max, MIN_BAR));
}

/** Sin tildes, sin mayúsculas y sin espacios de sobra. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Coincidencia sobre el nombre, para qué sirve y los nombres de sus líneas.
 *
 * Las tildes importan: quien escribe «rotacion» está buscando «Reducir la
 * rotación voluntaria», y una búsqueda que exija el acento le devuelve un
 * vacío que el catálogo no tiene.
 */
export function matchesTemplateQuery(template: TemplateDefinition, query: string): boolean {
  const term = normalize(query);
  if (term.length === 0) return true;
  const haystack = [
    template.name,
    template.label,
    template.description,
    ...template.items.map((item) => item.label),
  ].join(" ");
  return normalize(haystack).includes(term);
}

/** La primera marcada como destacada, o la primera del catálogo. */
export function featuredTemplate(
  groups: readonly TemplateGroup[]
): TemplateDefinition | undefined {
  const all = groups.flatMap((group) => group.templates);
  return all.find((template) => template.featured) ?? all[0];
}

/** Busca una plantilla por id en todo el catálogo. */
export function findTemplate(
  groups: readonly TemplateGroup[],
  id: string | null | undefined
): TemplateDefinition | undefined {
  if (!id) return undefined;
  for (const group of groups) {
    const found = group.templates.find((template) => template.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Qué enseñar junto a una plantilla que alguien ya está leyendo: primero las
 * de su propio estante —las alternativas de verdad—, después las demás.
 */
export function suggestTemplates(
  groups: readonly TemplateGroup[],
  current: TemplateDefinition,
  limit: number
): readonly TemplateDefinition[] {
  const ownGroup = groups.find((group) =>
    group.templates.some((template) => template.id === current.id)
  );
  const siblings = (ownGroup?.templates ?? []).filter((item) => item.id !== current.id);
  const others = groups
    .filter((group) => group !== ownGroup)
    .flatMap((group) => group.templates);
  return [...siblings, ...others].slice(0, limit);
}
