import { fold } from "./text";

export interface HighlightPart {
  text: string;
  hit: boolean;
}

/**
 * Pliega letra a letra para que cada posición del texto plegado sea la misma
 * del original: así «código» y «codigo» se buscan igual y el trozo que se
 * resalta es el que la persona lee, con sus tildes.
 */
function foldAligned(text: string): string {
  let out = "";
  for (const char of text) {
    const folded = fold(char);
    out += folded.length === 1 ? folded : folded.length === 0 ? "\u0000" : folded[0];
  }
  return out;
}

/**
 * Parte un texto en tramos normales y tramos que coinciden con alguno de los
 * términos (ya plegados), para pintar estos últimos como `<mark>`.
 */
export function splitHighlights(text: string, terms: readonly string[]): HighlightPart[] {
  const needles = [...new Set(terms.map(fold).filter((term) => term.length >= 2))].sort((a, b) => b.length - a.length);
  if (!needles.length || !text) return [{ text, hit: false }];
  const chars = [...text];
  const folded = foldAligned(text);
  const ranges: [number, number][] = [];
  const isWordChar = (index: number) => index >= 0 && index < folded.length && /[a-z0-9]/.test(folded[index]);
  for (const needle of needles) {
    let from = 0;
    for (;;) {
      const at = folded.indexOf(needle, from);
      if (at === -1) break;
      from = at + needle.length;
      // Solo desde el principio de una palabra: «me» no se marca dentro de
      // «número». Y una palabra corta tiene que ser la palabra entera.
      const startsWord = !isWordChar(at - 1);
      const endsWord = !isWordChar(at + needle.length);
      if (!startsWord || (needle.length <= 3 && !endsWord)) continue;
      ranges.push([at, at + needle.length]);
    }
  }
  if (!ranges.length) return [{ text, hit: false }];
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: chars.slice(cursor, start).join(""), hit: false });
    parts.push({ text: chars.slice(start, end).join(""), hit: true });
    cursor = end;
  }
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(""), hit: false });
  return parts;
}
