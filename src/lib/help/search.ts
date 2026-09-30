import { fold, stems, tokenize } from "./text";
import type { HelpRole, HelpSearchDoc } from "./types";

/**
 * Sinónimos de barbería: quien escribe «teléfono» tiene que encontrar
 * «celular», y «login» tiene que dar con «entrar». Cada grupo es una sola
 * idea; la búsqueda expande la palabra escrita a todo su grupo.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["celular", "numero", "telefono", "movil", "whatsapp", "linea"],
  ["codigo", "sms", "otp", "clave", "pin", "verificacion", "mensaje", "texto"],
  ["entrar", "ingresar", "login", "acceder", "acceso", "iniciar", "sesion", "loguear", "logear"],
  ["contrasena", "password", "codigo"],
  ["correo", "email", "mail", "gmail", "outlook", "hotmail", "microsoft"],
  ["bloqueado", "bloqueo", "bloquear", "bloquearon", "intentos", "bloqueada"],
  ["cita", "citas", "reserva", "reservas", "agenda", "turno", "booking", "agendar"],
  ["barbero", "barbera", "barberos", "estilista", "peluquero"],
  ["cliente", "clienta", "clientes", "clientela"],
  ["sucursal", "sucursales", "local", "sede", "tienda", "barberia"],
  // Sin «pago»: también es lo que paga un cliente, y arrastraba sus artículos a las preguntas de nómina.
  ["nomina", "liquidacion", "comision", "comisiones", "sueldo", "salario"],
  ["renta", "arriendo", "alquiler", "silla"],
  ["equipo", "personal", "staff", "usuarios", "empleados"],
  ["soporte", "ayuda", "ticket", "contacto", "contactar", "escribir"],
  ["salir", "cerrar", "logout", "desconectar"],
  ["ocupacion", "llena", "disponibilidad", "capacidad"],
  ["retencion", "churn", "perdidos", "regresan", "vuelven", "fidelidad"],
  ["precio", "precios", "tarifa", "cobrar", "cobro", "valor"],
  ["registrarse", "registro", "crear", "cuenta", "nueva", "empezar", "agregar", "anadir", "sumar"],
  ["recuperar", "olvide", "olvido", "perdi", "recordar"],
  ["vencio", "vencido", "expiro", "expirado", "caduco", "caducado"],
  ["error", "falla", "fallo", "problema", "incorrecto", "invalido"],
  ["rol", "roles", "perfil", "perfiles", "cargo"],
  ["permiso", "permisos", "permitir", "autorizar", "restringir"],
];

const SYNONYMS: ReadonlyMap<string, readonly string[]> = new Map(
  SYNONYM_GROUPS.flatMap((group) => group.map((word) => [word, group] as const))
);

/** La palabra, sus raíces sin plural y los sinónimos de cualquiera de ellas. */
function expand(token: string): string[] {
  const forms = stems(token);
  const group = forms.map((form) => SYNONYMS.get(form)).find(Boolean) ?? [];
  return [...new Set([...forms, ...group])];
}

/**
 * Distancia de edición con transposición (Damerau-Levenshtein, alineación
 * óptima), acotada: en cuanto supera `max` devuelve `max + 1`. Es lo que
 * perdona un dedo torcido: «codgo» → «codigo», «celuar» → «celular».
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: cols }, (_, j) => j);
  for (let i = 1; i < rows; i += 1) {
    const current: number[] = [i];
    let rowMin = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, prev2[j - 2] + 1);
      current.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = current;
  }
  return prev[cols - 1];
}

/** Cuántos errores se perdonan según lo larga que sea la palabra. */
function typoBudget(token: string): number {
  if (token.length >= 8) return 2;
  if (token.length >= 5) return 1;
  return 0;
}

interface IndexedDoc {
  doc: HelpSearchDoc;
  title: string;
  description: string;
  section: string;
  keywords: readonly string[];
  headings: readonly string[];
  questions: readonly string[];
  body: string;
  /** Los mismos campos reducidos a sus palabras con sentido, para buscar frases: «barbero de renta» → «barbero renta». */
  titleTokens: string;
  secondaryTokens: readonly string[];
  bodyTokens: string;
}

interface Index {
  docs: readonly IndexedDoc[];
  /** Todas las palabras del contenido, sin tildes, para corregir tipeos. */
  vocabulary: readonly string[];
}

const WORD = /[a-z0-9]{3,}/g;

const asTokens = (value: string): string => tokenize(value).join(" ");

const INDEX_CACHE = new WeakMap<readonly HelpSearchDoc[], Index>();

/** El índice se pliega una sola vez por lista de documentos. */
function indexOf(docs: readonly HelpSearchDoc[]): Index {
  const cached = INDEX_CACHE.get(docs);
  if (cached) return cached;
  const vocabulary = new Set<string>();
  const indexed = docs.map<IndexedDoc>((doc) => {
    const entry: IndexedDoc = {
      doc,
      title: fold(doc.title),
      description: fold(doc.description),
      section: fold(doc.sectionTitle ?? ""),
      keywords: doc.keywords.map(fold),
      headings: doc.headings.map(fold),
      questions: (doc.questions ?? []).map(fold),
      body: fold(doc.text),
      titleTokens: asTokens(doc.title),
      secondaryTokens: [doc.description, ...doc.headings, ...(doc.questions ?? []), ...doc.keywords].map(asTokens),
      bodyTokens: asTokens(doc.text),
    };
    for (const field of [entry.title, entry.description, entry.body, ...entry.keywords, ...entry.headings, ...entry.questions]) {
      for (const match of field.matchAll(WORD)) vocabulary.add(match[0]);
    }
    return entry;
  });
  const index: Index = { docs: indexed, vocabulary: [...vocabulary] };
  INDEX_CACHE.set(docs, index);
  return index;
}

export interface HelpSearchHit {
  id: string;
  score: number;
  /** El mejor pasaje del cuerpo para la lista: la frase con más coincidencias. */
  snippet: string;
  /** Las palabras que coincidieron, ya sin tildes, para resaltarlas. */
  matched: readonly string[];
}

export interface HelpSearchCorrection {
  from: string;
  to: string;
}

export interface HelpSearchResult {
  hits: HelpSearchHit[];
  /** Palabras que no existían y se sustituyeron por la más parecida. */
  corrections: HelpSearchCorrection[];
}

export interface HelpSearchOptions {
  /** El rol de quien busca: sus artículos suben un poco. */
  role?: HelpRole;
  limit?: number;
  /**
   * La última palabra puede estar a medias («cod» de «código»): se acepta
   * como prefijo. Es lo normal mientras alguien escribe; en una página de
   * resultados ya está completa.
   */
  typing?: boolean;
}

const WEIGHTS = {
  phraseInTitle: 40,
  phraseInSecondary: 15,
  phraseInBody: 8,
  titleToken: 12,
  keyword: 8,
  question: 6,
  heading: 5,
  description: 4,
  section: 3,
  body: 1,
  bodyCap: 6,
  allMatched: 10,
  /** Un título corto que tiene todas las palabras de la consulta es «la» respuesta a esa pregunta. */
  titleCoverage: 20,
  roleMatch: 2,
  published: 1,
  /** Lo que vale una coincidencia corregida frente a una exacta. */
  fuzzyFactor: 0.7,
  prefixFactor: 0.85,
} as const;

interface QueryTerm {
  token: string;
  /** Formas que cuentan como coincidencia exacta: la palabra, su raíz, sus sinónimos. */
  exact: readonly string[];
  /** Formas por tipeo corregido; valen menos. */
  fuzzy: readonly string[];
  /** Si `token` puede ir a medias. */
  prefix: boolean;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
}

/** La palabra del vocabulario más cercana al token, si hay alguna dentro del presupuesto. */
function closestWord(token: string, vocabulary: readonly string[]): string | null {
  const budget = typoBudget(token);
  if (budget === 0) return null;
  let best: string | null = null;
  let bestDistance = budget + 1;
  for (const word of vocabulary) {
    if (word === token) return null;
    const distance = editDistance(token, word, budget);
    if (distance < bestDistance || (distance === bestDistance && best && word.length < best.length)) {
      best = word;
      bestDistance = distance;
    }
  }
  return bestDistance <= budget ? best : null;
}

function buildTerms(query: string, index: Index, typing: boolean): { terms: QueryTerm[]; corrections: HelpSearchCorrection[] } {
  const tokens = tokenize(query);
  const corrections: HelpSearchCorrection[] = [];
  const endsOpen = typing && !/\s$/.test(query);
  const terms = tokens.map<QueryTerm>((token, position) => {
    const exact = expand(token);
    const isLast = position === tokens.length - 1;
    const known = index.vocabulary.some((word) => exact.some((variant) => word === variant || (isLast && endsOpen && word.startsWith(token))));
    let fuzzy: string[] = [];
    if (!known) {
      const fixed = closestWord(token, index.vocabulary);
      if (fixed) {
        fuzzy = expand(fixed);
        corrections.push({ from: token, to: fixed });
      }
    }
    return { token, exact, fuzzy, prefix: isLast && endsOpen && token.length >= 3 };
  });
  return { terms, corrections };
}

const SHORT_TERM = 3;

/**
 * Si el campo contiene la forma. Una palabra corta («me», «no», «sms») solo
 * cuenta entera: «me» dentro de «número» no es una coincidencia.
 */
function containsTerm(field: string, variant: string): boolean {
  if (variant.length > SHORT_TERM) return field.includes(variant);
  return new RegExp(`(^|[^a-z0-9])${variant}([^a-z0-9]|$)`).test(field);
}

/** Si alguna forma del término aparece en el campo; devuelve la forma y cuánto vale. */
function fieldMatch(field: string, term: QueryTerm): { variant: string; factor: number } | null {
  for (const variant of term.exact) if (containsTerm(field, variant)) return { variant, factor: 1 };
  if (term.prefix) {
    const at = field.search(new RegExp(`(^|[^a-z0-9])${term.token}`));
    if (at !== -1) return { variant: term.token, factor: WEIGHTS.prefixFactor };
  }
  for (const variant of term.fuzzy) if (containsTerm(field, variant)) return { variant, factor: WEIGHTS.fuzzyFactor };
  return null;
}

/**
 * La frase más larga de la consulta (por palabras con sentido) que aparece
 * seguida en el campo. «roles barbero renta» encuentra «barbero renta» en
 * «puede hacer ve barbero renta». Devuelve cuántas palabras tiene, o 0.
 */
function longestPhrase(field: string, tokens: readonly string[]): number {
  if (tokens.length < 2 || !field) return 0;
  const padded = ` ${field} `;
  for (let size = tokens.length; size >= 2; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      if (padded.includes(` ${tokens.slice(start, start + size).join(" ")} `)) return size;
    }
  }
  return 0;
}

function anyMatch(fields: readonly string[], term: QueryTerm): { variant: string; factor: number } | null {
  for (const field of fields) {
    const match = fieldMatch(field, term);
    if (match) return match;
  }
  return null;
}

/** La frase del cuerpo que más términos junta, recortada alrededor de la primera coincidencia. */
function bestSnippet(text: string, matched: readonly string[], width = 160): string {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter((sentence) => sentence.trim().length > 0);
  let best = sentences[0] ?? "";
  let bestCount = -1;
  for (const sentence of sentences) {
    const folded = fold(sentence);
    const count = matched.filter((term) => folded.includes(term)).length;
    if (count > bestCount) {
      best = sentence;
      bestCount = count;
    }
  }
  const trimmed = best.trim();
  if (trimmed.length <= width) return trimmed;
  const folded = fold(trimmed);
  let first = -1;
  for (const term of matched) {
    const at = folded.indexOf(term);
    if (at !== -1 && (first === -1 || at < first)) first = at;
  }
  const start = Math.max(0, (first === -1 ? 0 : first) - Math.floor(width / 3));
  const cut = trimmed.slice(start, start + width).trim();
  return `${start > 0 ? "…" : ""}${cut}${start + width < trimmed.length ? "…" : ""}`;
}

/**
 * Busca como Slack: el título manda, luego las palabras clave, las preguntas
 * frecuentes, los encabezados y la descripción, y por último el cuerpo. Todo
 * sin tildes, con sinónimos, sin plurales, con la última palabra a medias
 * mientras se escribe y perdonando un dedo torcido. Una frase entera que
 * aparece tal cual vale más que sus palabras sueltas.
 */
export function searchHelpDetailed(docs: readonly HelpSearchDoc[], query: string, options: HelpSearchOptions = {}): HelpSearchResult {
  const index = indexOf(docs);
  const { terms, corrections } = buildTerms(query, index, options.typing ?? false);
  if (!terms.length) return { hits: [], corrections: [] };
  const tokens = terms.map((term) => term.token);

  const hits: HelpSearchHit[] = [];
  for (const entry of index.docs) {
    let score = 0;
    let matchedTerms = 0;
    let allExact = true;
    const matched = new Set<string>();
    let inTitleCount = 0;

    for (const term of terms) {
      let termScore = 0;
      let factor = 0;
      const record = (match: { variant: string; factor: number } | null, weight: number) => {
        if (!match) return;
        termScore += weight;
        factor = Math.max(factor, match.factor);
        matched.add(match.variant);
      };
      const titleMatch = fieldMatch(entry.title, term);
      if (titleMatch) inTitleCount += 1;
      record(titleMatch, WEIGHTS.titleToken);
      record(anyMatch(entry.keywords, term), WEIGHTS.keyword);
      record(anyMatch(entry.questions, term), WEIGHTS.question);
      record(anyMatch(entry.headings, term), WEIGHTS.heading);
      record(fieldMatch(entry.description, term), WEIGHTS.description);
      record(fieldMatch(entry.section, term), WEIGHTS.section);
      const inBody = fieldMatch(entry.body, term);
      if (inBody) {
        const occurrences = countOccurrences(entry.body, inBody.variant);
        record(inBody, Math.min(WEIGHTS.bodyCap, occurrences * WEIGHTS.body));
      }
      if (termScore > 0) {
        matchedTerms += 1;
        score += termScore * factor;
        if (factor < 1) allExact = false;
      }
    }

    if (matchedTerms === 0) continue;

    // Una frase seguida vale según cuántas palabras de la consulta junta.
    const inTitle = longestPhrase(entry.titleTokens, tokens);
    if (inTitle) score += (WEIGHTS.phraseInTitle * inTitle) / tokens.length;
    else {
      const inSecondary = Math.max(0, ...entry.secondaryTokens.map((field) => longestPhrase(field, tokens)));
      if (inSecondary) score += (WEIGHTS.phraseInSecondary * inSecondary) / tokens.length;
      else {
        const inBody = longestPhrase(entry.bodyTokens, tokens);
        if (inBody) score += (WEIGHTS.phraseInBody * inBody) / tokens.length;
      }
    }

    // Todas las palabras en el título, y cuanto menos título sobre, mejor: «crear una cita»
    // gana a «crear una cita para un cliente nuevo».
    if (inTitleCount === terms.length) score += (WEIGHTS.titleCoverage * terms.length) / Math.max(terms.length, entry.titleTokens.split(" ").length);

    // Coincidir con todas las palabras vale más que coincidir mucho con una.
    score *= matchedTerms / terms.length;
    if (matchedTerms === terms.length && allExact) score += WEIGHTS.allMatched;
    if (options.role && (entry.doc.roles.includes(options.role) || entry.doc.roles.includes("todos"))) score += WEIGHTS.roleMatch;
    if (entry.doc.status === "published") score += WEIGHTS.published;

    const matchedList = [...matched];
    hits.push({ id: entry.doc.id, score: Math.round(score * 100) / 100, snippet: bestSnippet(entry.doc.text, matchedList), matched: matchedList });
  }

  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { hits: options.limit ? hits.slice(0, options.limit) : hits, corrections };
}

/** Solo los resultados, para quien no necesita saber qué se corrigió. */
export function searchHelp(docs: readonly HelpSearchDoc[], query: string, options: HelpSearchOptions = {}): HelpSearchHit[] {
  return searchHelpDetailed(docs, query, options).hits;
}
