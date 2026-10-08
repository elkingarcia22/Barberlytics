/** Sin tildes y en minúsculas: «Código» → «codigo». */
export function fold(value: string): string {
  // El índice viene de YAML: una palabra clave como `+57` puede llegar como número.
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * «¿Qué revisar primero?» → «que-revisar-primero». Es el mismo algoritmo que
 * usa el generador del repo de contenido (`scripts/lib/markdown.mjs`): así el
 * índice lateral apunta a los encabezados que el renderizador dibuja.
 */
export function slugify(text: string): string {
  return fold(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

/**
 * Palabras que no distinguen un artículo de otro. «no», «me», «mi» y «tu» se
 * quedan: «no me llega el código» tiene que pesar por el «no».
 */
const STOP_WORDS: ReadonlySet<string> = new Set([
  "de", "del", "la", "el", "lo", "los", "las", "un", "una", "unos", "unas", "y", "o", "u", "a", "al", "en",
  "que", "con", "por", "para", "es", "su", "sus", "se", "como", "the", "of", "to", "and", "in", "on",
  // Las de preguntar: «qué roles tiene el barbero» pesa por «roles» y «barbero», no por «tiene».
  "tiene", "tienen", "tengo", "tener", "hay", "cual", "cuales", "donde", "cuando", "quien", "quiero",
  "necesito", "saber", "sobre", "algo", "alguien",
  // Los verbos de «¿cómo…?» que no dicen qué se busca: «dónde veo las comisiones» pesa por «comisiones».
  "veo", "ver", "puedo", "hago", "hacer", "pongo", "poner", "este", "esta", "esto", "ese", "esa", "eso", "le", "les",
  // Lo mismo en inglés, para el contenido traducido: «how do I see my commissions» pesa por «commissions».
  // «no», «not» y «my» se quedan por la misma razón que en español.
  "an", "is", "are", "was", "be", "it", "its", "for", "with", "at", "by", "from", "as", "or", "this", "that", "these", "those",
  "how", "what", "where", "when", "who", "which", "why", "do", "does", "did", "can", "could", "should", "would", "will",
  "have", "has", "there", "want", "need", "know", "about", "some", "someone", "something", "see", "get", "make", "put",
  "you", "your", "they", "them", "their", "we", "our", "us",
]);

/** Palabras de búsqueda: sin tildes, sin signos, sin las vacías ni las de una letra. */
export function tokenize(query: string): string[] {
  return fold(query)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Las raíces de una palabra: «roles» → «rol», «clientes» → «cliente». Devuelve
 * la palabra y sus raíces sin plural, de la más larga a la más corta.
 *
 * Y el infinitivo de un verbo en primera persona: la gente pregunta «¿cómo
 * creo una cita?» y los artículos se titulan «Crear una cita». «creo» añade
 * «crear», «creer» y «crir»; las que no existen no coinciden con nada, y a un
 * sustantivo en -o («barbero») le sobran sin estorbar.
 */
const MIN_VERB = 4;

export function stems(token: string): string[] {
  const forms = [token];
  if (token.length > 4 && token.endsWith("s")) forms.push(token.slice(0, -1));
  if (token.length >= 5 && token.endsWith("es")) forms.push(token.slice(0, -2));
  if (token.length >= MIN_VERB && token.endsWith("o")) {
    const root = token.slice(0, -1);
    forms.push(`${root}ar`, `${root}er`, `${root}ir`);
  }
  // En inglés, el gerundio y el pasado: «booking» → «book», «blocked» → «block», «created» → «create».
  if (token.length > 5 && token.endsWith("ing")) forms.push(token.slice(0, -3), `${token.slice(0, -3)}e`);
  if (token.length > 4 && token.endsWith("ed")) forms.push(token.slice(0, -2), token.slice(0, -1));
  return forms;
}
