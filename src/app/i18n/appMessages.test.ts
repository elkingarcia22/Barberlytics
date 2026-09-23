import { describe, expect, test } from "vitest";
import { appEn, appEs, APP_MESSAGES } from ".";
import { es as systemEs } from "@/i18n";

/**
 * El diccionario de la aplicación es la segunda capa del idioma: si se
 * desincroniza, la pantalla se ve a medio traducir y nadie se entera hasta
 * que un cliente la abre en inglés.
 */
describe("diccionario de la aplicación", () => {
  test("el inglés traduce todas las claves del español", () => {
    expect(Object.keys(appEn).sort()).toEqual(Object.keys(appEs).sort());
  });

  test("ninguna traducción se quedó en blanco", () => {
    for (const [key, value] of Object.entries(appEn)) {
      expect(value, `appEn.${key}`).not.toBe("");
    }
  });

  test("los parámetros de una cadena son los mismos en los dos idiomas", () => {
    const params = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const [key, value] of Object.entries(appEs)) {
      const translated = appEn[key as keyof typeof appEn];
      expect(params(translated), `appEn.${key}`).toEqual(params(value));
    }
  });

  test("no pisa por accidente una clave del sistema", () => {
    // Pisar una es legítimo (para eso se consulta antes), pero tiene que ser
    // una decisión y no un choque de nombres: hoy no hay ninguna.
    const collisions = Object.keys(appEs).filter((key) => key in systemEs);
    expect(collisions).toEqual([]);
  });

  test("el catálogo que se enchufa al provider trae los dos idiomas", () => {
    expect(APP_MESSAGES.es).toBe(appEs);
    expect(APP_MESSAGES.en).toBe(appEn);
  });
});
