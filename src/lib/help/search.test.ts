import { describe, expect, test } from "vitest";
import { editDistance, searchHelp, searchHelpDetailed } from "./search";
import { splitHighlights } from "./highlight";
import { articlesForScreen, screenMatches, toProductionRoute } from "./screens";
import { slugify, tokenize } from "./text";
import type { HelpIndex, HelpSearchDoc } from "./types";

const doc = (partial: Partial<HelpSearchDoc> & Pick<HelpSearchDoc, "id" | "title">): HelpSearchDoc => ({
  description: "",
  section: partial.id.split("/")[0],
  keywords: [],
  headings: [],
  questions: [],
  roles: ["todos"],
  status: "published",
  text: "",
  ...partial,
});

const DOCS: HelpSearchDoc[] = [
  doc({
    id: "acceso-y-cuenta/ingresar",
    title: "Entrar con tu celular y el código por SMS",
    description: "Cómo entras a Barberlytics en dos pasos.",
    keywords: ["entrar", "login", "celular", "código"],
    headings: ["Pasos", "Errores que puedes ver"],
    questions: ["¿Por qué no hay contraseña?"],
    text: "Escribe tu celular, toca Enviar código y escribe los 6 dígitos. No hay contraseña que recordar.",
  }),
  doc({
    id: "acceso-y-cuenta/no-me-llega-el-codigo",
    title: "No me llega el código por SMS",
    description: "Qué revisar cuando pides el código y no aparece.",
    keywords: ["sms", "no llega", "reenviar"],
    headings: ["Qué revisar primero", "Si sigue sin llegar"],
    questions: ["¿El código tiene costo?"],
    text: "El SMS suele tardar menos de un minuto. Toca Reenviar código. Revisa la señal del celular.",
  }),
  doc({
    id: "acceso-y-cuenta/entrar-con-google-o-outlook",
    title: "Entrar con Google o con Outlook",
    keywords: ["google", "outlook", "gmail"],
    text: "Debajo del campo del celular están los botones Google y Outlook.",
  }),
  doc({
    id: "nomina/comision-por-tipo-de-cliente",
    title: "Cómo se calcula la comisión de cada barbero",
    keywords: ["comisión", "nómina", "tarifa"],
    roles: ["owner", "admin"],
    text: "Una tarifa por tipo de cliente: nuevo, retenido, repite, leal.",
  }),
];

describe("searchHelp", () => {
  test("«¿dónde veo las comisiones?» va a la comisión, no a los pagos de un cliente", () => {
    const docs = [
      ...DOCS,
      doc({ id: "clientes/pagos-de-un-cliente", title: "Los pagos de un cliente", text: "Aquí ves cada pago que hizo el cliente; si no lo veo, reviso el método de pago." }),
    ];

    expect(searchHelp(docs, "¿Dónde veo las comisiones?")[0]?.id).toBe("nomina/comision-por-tipo-de-cliente");
  });

  test("una pregunta en primera persona encuentra la tarea en infinitivo: «¿cómo creo una cita?»", () => {
    const docs = [
      doc({ id: "calendario/citas-online", title: "Citas que crea el cliente: cuándo entran", text: "Cuando tu cliente agenda solo, la cita entra sola." }),
      doc({ id: "calendario/crear-una-cita", title: "Crear una cita", text: "Toca Acciones y elige Crear cita." }),
      doc({ id: "calendario/cobrar-una-cita", title: "Cobrar una cita", text: "Toca Pagar cita." }),
    ];

    expect(searchHelp(docs, "¿Cómo creo una cita?")[0]?.id).toBe("calendario/crear-una-cita");
    expect(searchHelp(docs, "¿Cómo cobro una cita?")[0]?.id).toBe("calendario/cobrar-una-cita");
  });

  test("el título manda: «no me llega el código» encuentra ese artículo primero", () => {
    expect(searchHelp(DOCS, "no me llega el código")[0]?.id).toBe("acceso-y-cuenta/no-me-llega-el-codigo");
  });

  test("busca sin tildes y con sinónimos: «telefono» encuentra «celular»", () => {
    expect(searchHelp(DOCS, "telefono").map((hit) => hit.id)).toContain("acceso-y-cuenta/ingresar");
  });

  test("«login» encuentra el artículo de entrar", () => {
    expect(searchHelp(DOCS, "login")[0]?.id).toBe("acceso-y-cuenta/ingresar");
  });

  test("perdona un tipeo: «codgo» se corrige a «codigo» y lo dice", () => {
    const result = searchHelpDetailed(DOCS, "codgo");
    expect(result.corrections).toEqual([{ from: "codgo", to: "codigo" }]);
    expect(result.hits.length).toBeGreaterThan(0);
  });

  test("mientras se escribe, la última palabra vale como prefijo", () => {
    expect(searchHelp(DOCS, "goo", { typing: true })[0]?.id).toBe("acceso-y-cuenta/entrar-con-google-o-outlook");
    expect(searchHelp(DOCS, "entrar con outl", { typing: true })[0]?.id).toBe("acceso-y-cuenta/entrar-con-google-o-outlook");
  });

  test("una pregunta frecuente cuenta: «contraseña» da con el artículo que la responde", () => {
    expect(searchHelp(DOCS, "contraseña")[0]?.id).toBe("acceso-y-cuenta/ingresar");
  });

  test("la frase entera en el título gana a las palabras sueltas", () => {
    expect(searchHelp(DOCS, "entrar con google")[0]?.id).toBe("acceso-y-cuenta/entrar-con-google-o-outlook");
  });

  test("no devuelve nada si ninguna palabra coincide", () => {
    expect(searchHelp(DOCS, "inventario de productos")).toEqual([]);
    expect(searchHelp(DOCS, "")).toEqual([]);
  });

  test("el rol de quien busca sube sus artículos y el límite recorta", () => {
    const owner = searchHelp(DOCS, "comisión", { role: "owner" })[0];
    const barber = searchHelp(DOCS, "comisión", { role: "barbero" })[0];
    expect(owner?.score).toBeGreaterThan(barber?.score ?? 0);
    expect(searchHelp(DOCS, "código", { limit: 1 })).toHaveLength(1);
  });

  test("el fragmento es la frase con más coincidencias y trae los términos", () => {
    const hit = searchHelp(DOCS, "reenviar").find((item) => item.id === "acceso-y-cuenta/no-me-llega-el-codigo");
    expect(hit?.snippet).toBe("Toca Reenviar código.");
    expect(hit?.matched).toContain("reenviar");
  });
});

describe("frases, raíces y sección", () => {
  const roles = [
    doc({ id: "roles-y-permisos/los-cinco-roles", title: "Los cinco roles y para qué sirve cada uno", sectionTitle: "Roles y permisos", keywords: ["roles"], text: "Barbero por comisión y barbero de renta." }),
    doc({ id: "roles-y-permisos/permisos-barbero-de-renta", title: "Qué puede hacer y qué ve el barbero de renta", sectionTitle: "Roles y permisos", keywords: ["barbero de renta"], text: "Tiene tres bloques." }),
    doc({ id: "empezar/guia", title: "Un día como dueño", sectionTitle: "Empezar", keywords: [], text: "Hay una pestaña por barbero por comisión, barbero de renta y barbero por salario. Los roles se ven en Permisos." }),
  ];

  test("«que roles tiene el barbero renta» pone primero al barbero de renta, no a la guía que solo lo menciona", () => {
    const ids = searchHelp(roles, "que roles tiene el barbero renta").map((hit) => hit.id);
    expect(ids[0]).toBe("roles-y-permisos/permisos-barbero-de-renta");
    expect(ids.indexOf("empezar/guia")).toBeGreaterThan(ids.indexOf("roles-y-permisos/los-cinco-roles"));
  });

  test("«rol» encuentra «roles» y «tabla de permisos por rol» encuentra «permisos»", () => {
    expect(tokenize("qué roles tiene")).toEqual(["roles"]);
    expect(searchHelp(roles, "rol")[0]?.id).toBe("roles-y-permisos/los-cinco-roles");
  });

  test("la sección cuenta: «permisos» sube los artículos de «Roles y permisos» aunque el título no lo diga", () => {
    const ids = searchHelp(roles, "permisos").map((hit) => hit.id);
    expect(ids).toContain("roles-y-permisos/los-cinco-roles");
  });
});

describe("índice con valores que YAML no deja como texto", () => {
  test("una palabra clave numérica («+57») no rompe la búsqueda", () => {
    const docs = [doc({ id: "a/pais", title: "Elegir el país", keywords: [57 as unknown as string, "prefijo"], text: "Prefijo del país." })];
    expect(() => searchHelp(docs, "prefijo")).not.toThrow();
    expect(searchHelp(docs, "prefijo")[0]?.id).toBe("a/pais");
  });
});

describe("editDistance", () => {
  test("cuenta sustituciones, huecos y letras cruzadas", () => {
    expect(editDistance("codigo", "codigo", 2)).toBe(0);
    expect(editDistance("codgo", "codigo", 2)).toBe(1);
    expect(editDistance("cdoigo", "codigo", 2)).toBe(1);
    expect(editDistance("celuar", "celular", 2)).toBe(1);
    expect(editDistance("perro", "gato", 2)).toBe(3);
  });
});

describe("splitHighlights", () => {
  test("resalta las coincidencias conservando tildes y une solapes", () => {
    const parts = splitHighlights("Toca Reenviar código ahora", ["codigo", "reenviar"]);
    expect(parts).toEqual([
      { text: "Toca ", hit: false },
      { text: "Reenviar", hit: true },
      { text: " ", hit: false },
      { text: "código", hit: true },
      { text: " ahora", hit: false },
    ]);
  });

  test("una palabra corta solo se marca entera y desde el inicio de palabra", () => {
    expect(splitHighlights("No me llega el número", ["me", "no"])).toEqual([
      { text: "No", hit: true },
      { text: " ", hit: false },
      { text: "me", hit: true },
      { text: " llega el número", hit: false },
    ]);
  });

  test("sin coincidencias devuelve el texto tal cual", () => {
    expect(splitHighlights("Hola", ["xyz"])).toEqual([{ text: "Hola", hit: false }]);
  });
});

describe("tokenize y slugify", () => {
  test("tokenize quita tildes, signos y palabras vacías", () => {
    expect(tokenize("¿Cómo entro a la app?")).toEqual(["entro", "app"]);
    expect(tokenize("No me llega el código")).toEqual(["no", "me", "llega", "codigo"]);
  });

  test("slugify coincide con el generador del contenido", () => {
    expect(slugify("¿Qué revisar primero?")).toBe("que-revisar-primero");
    expect(slugify("Errores que puedes ver")).toBe("errores-que-puedes-ver");
  });
});

describe("screens", () => {
  const index: HelpIndex = {
    locale: "es",
    generatedAt: "",
    siteUrl: "",
    sections: [],
    articles: {
      "a/exacto": { id: "a/exacto", title: "Exacto", description: "", section: "a", order: 10, roles: ["todos"], screens: ["/settings/sales-pricing"], keywords: [], related: [], status: "published", updated: "", headings: [], readingMinutes: 1, path: "" },
      "a/comodin": { id: "a/comodin", title: "Comodín", description: "", section: "a", order: 20, roles: ["todos"], screens: ["/settings/*"], keywords: [], related: [], status: "published", updated: "", headings: [], readingMinutes: 1, path: "" },
      "b/todo": { id: "b/todo", title: "Todo", description: "", section: "b", order: 10, roles: ["todos"], screens: ["/*"], keywords: [], related: [], status: "published", updated: "", headings: [], readingMinutes: 1, path: "" },
    },
    screens: { "/settings/sales-pricing": ["a/exacto"], "/settings/*": ["a/comodin"], "/*": ["b/todo"] },
  };

  test("screenMatches entiende exacto, comodín y todo", () => {
    expect(screenMatches("/profile", "/profile")).toBe(true);
    expect(screenMatches("/profile", "/profile/")).toBe(true);
    expect(screenMatches("/profile", "/calendar")).toBe(false);
    expect(screenMatches("/settings/*", "/settings")).toBe(true);
    expect(screenMatches("/settings/*", "/settings/sales-pricing")).toBe(true);
    expect(screenMatches("/settings/*", "/settings-viejo")).toBe(false);
    expect(screenMatches("/*", "/lo-que-sea")).toBe(true);
  });

  test("las rutas del rediseño se traducen a las de producción", () => {
    expect(toProductionRoute("/dashboard")).toBe("/");
    expect(toProductionRoute("/clientes/8")).toBe("/customers/8");
    expect(toProductionRoute("/usuarios/lista")).toBe("/team/barbers/lista");
    expect(toProductionRoute("/configuracion/precios")).toBe("/settings/precios");
    expect(toProductionRoute("/profile")).toBe("/profile");
    expect(screenMatches("/customers", "/clientes")).toBe(true);
    expect(screenMatches("/authenticate", "/login")).toBe(true);
  });

  test("articlesForScreen pone lo más específico primero", () => {
    expect(articlesForScreen(index, "/settings/sales-pricing").map((item) => item.id)).toEqual(["a/exacto", "a/comodin", "b/todo"]);
    // Desde el rediseño, la misma pantalla con su ruta propia.
    expect(articlesForScreen(index, "/configuracion/sales-pricing").map((item) => item.id)).toEqual(["a/exacto", "a/comodin", "b/todo"]);
    expect(articlesForScreen(index, "/dashboard").map((item) => item.id)).toEqual(["b/todo"]);
  });
});
