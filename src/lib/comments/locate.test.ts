import { afterEach, describe, expect, test } from "vitest";
import { describeElement, describeModule, describeSection } from "./locate";

afterEach(() => {
  document.body.innerHTML = "";
});

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe("dónde cayó un comentario", () => {
  test("el elemento: un botón por su texto, un control por su etiqueta y un campo por su placeholder", () => {
    mount(`
      <button id="b">Guardar cambios</button>
      <label for="s">Usar la apariencia general</label><button id="s" role="switch" aria-checked="true"></button>
      <input id="i" placeholder="Buscar cliente" />
      <a href="/x" aria-label="Ver la reserva"><span id="inner">↗</span></a>
    `);
    expect(describeElement(document.getElementById("b")!)).toBe("Botón «Guardar cambios»");
    expect(describeElement(document.getElementById("s")!)).toBe("Opción «Usar la apariencia general»");
    expect(describeElement(document.getElementById("i")!)).toBe("Campo «Buscar cliente»");
    // Un clic en algo de dentro sube al elemento que lo contiene.
    expect(describeElement(document.getElementById("inner")!)).toBe("Enlace «Ver la reserva»");
  });

  test("un bloque sin control se nombra por su primera línea", () => {
    mount(`<div id="card"><p>Ticket promedio</p><p>US$ 39,81</p></div>`);
    // jsdom no tiene innerText: se arma con textContent, que no corta renglones.
    const card = document.getElementById("card")!;
    Object.defineProperty(card, "innerText", { value: "Ticket promedio\nUS$ 39,81" });
    expect(describeElement(card)).toBe("Bloque «Ticket promedio»");
  });

  test("la sección: título de la página, pestaña activa y las secciones que rodean el punto", () => {
    mount(`
      <main>
        <h1>Reservas online</h1>
        <div role="tablist"><button role="tab" aria-selected="false">Reglas</button><button role="tab" aria-selected="true">Apariencia</button></div>
        <section aria-labelledby="t"><h2 id="t">Apariencia de la reserva</h2><button id="target">Ver</button></section>
      </main>
    `);
    expect(describeSection(document.getElementById("target")!)).toBe("Reservas online › Apariencia › Apariencia de la reserva");
  });

  test("el módulo: la ruta del menú de la cabecera, tramo por tramo", () => {
    mount(`<nav aria-label="Breadcrumb"><a>Configuración</a><i aria-hidden="true"></i><a>Negocio</a><i aria-hidden="true"></i><span>Reservas online</span></nav>`);
    expect(describeModule()).toBe("Configuración › Negocio › Reservas online");
    document.body.innerHTML = "";
    expect(describeModule()).toBeUndefined();
  });
});
