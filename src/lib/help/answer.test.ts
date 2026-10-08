import { describe, expect, test } from "vitest";
import { answerFromArticle, isConfidentAnswer } from "./answer";

const ARTICLE = `---
id: calendario/crear-una-cita
title: "Crear una cita"
---

# Crear una cita

**En resumen:** toca **Acciones › Crear cita** y toca **Crear**.

## Pasos

1. En el **Calendario**, toca **Acciones**.
   ![El panel Crear cita](/assets/es/calendario/crear-una-cita/panel.png)
2. Si es nuevo, toca **Crear cliente** ([Crear una cita para un cliente nuevo](/ayuda/calendario/crear-una-cita-para-un-cliente-nuevo)).
3. Toca **Crear**.

## Preguntas frecuentes

**¿Puedo agendar dos servicios?**
Sí.
`;

describe("answerFromArticle", () => {
  test("toma el resumen y los pasos, sin frontmatter, título ni capturas", () => {
    const answer = answerFromArticle(ARTICLE);

    expect(answer.summary).toBe("Toca **Acciones › Crear cita** y toca **Crear**.");
    expect(answer.heading).toBe("Pasos");
    expect(answer.body).toContain("1. En el **Calendario**, toca **Acciones**.");
    expect(answer.body).toContain("3. Toca **Crear**.");
    expect(answer.body).not.toContain("![");
    expect(answer.body).not.toContain("Preguntas frecuentes");
  });

  test("sin «Pasos», usa la primera sección que dice cómo llegar o dónde está", () => {
    const answer = answerFromArticle(`# Los reportes\n\n## Para qué te sirve\n\nPara ver.\n\n## Dónde está\n\nEn **Reportes**.\n`);

    expect(answer.summary).toBeNull();
    expect(answer.heading).toBe("Dónde está");
    expect(answer.body).toBe("En **Reportes**.");
  });

  test("sin nada reconocible devuelve el primer párrafo como resumen", () => {
    const answer = answerFromArticle(`# Algo\n\nUn párrafo que explica.\n\nOtro párrafo.\n`);

    expect(answer.summary).toBe("Un párrafo que explica.");
    expect(answer.body).toBeNull();
  });

  test("entiende los artículos traducidos al inglés", () => {
    const answer = answerFromArticle(`# Create an appointment\n\n**In short:** tap **Actions › Create appointment**.\n\n## Steps\n\n1. Tap **Create**.\n\n## Frequently asked questions\n\n**Can I?**\nYes.\n`);

    expect(answer.summary).toBe("Tap **Actions › Create appointment**.");
    expect(answer.heading).toBe("Steps");
    expect(answer.body).toBe("1. Tap **Create**.");
  });

  test("corta las listas largas para que la respuesta quepa en el chat", () => {
    const steps = Array.from({ length: 14 }, (_, i) => `${i + 1}. Paso ${i + 1}.`).join("\n");
    const answer = answerFromArticle(`# Largo\n\n## Pasos\n\n${steps}\n`);

    expect(answer.body?.split("\n").filter(Boolean)).toHaveLength(8);
    expect(answer.truncated).toBe(true);
  });
});

describe("isConfidentAnswer", () => {
  test("responde si el artículo junta más de la mitad de las palabras con sentido", () => {
    expect(isConfidentAnswer({ matched: ["crear", "cita"] }, "¿Cómo creo una cita?")).toBe(true);
    expect(isConfidentAnswer({ matched: ["no", "llega", "codigo"] }, "no me llega el código")).toBe(true);
  });

  test("no responde con un artículo que solo roza la pregunta", () => {
    expect(isConfidentAnswer({ matched: ["marcar"] }, "xyzqw plataforma marciana")).toBe(false);
    expect(isConfidentAnswer({ matched: ["plataforma"] }, "plataforma marciana")).toBe(false);
    expect(isConfidentAnswer(undefined, "algo")).toBe(false);
  });
});
