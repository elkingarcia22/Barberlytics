import { describe, expect, test } from "vitest";
import { groupSectionArticles } from "./groups";
import type { HelpArticleMeta, HelpSection } from "./types";

const meta = (id: string, group?: string): HelpArticleMeta => ({
  id,
  title: id,
  description: "",
  section: id.split("/")[0],
  order: 10,
  group: group ?? null,
  roles: ["todos"],
  screens: [],
  keywords: [],
  related: [],
  status: "review",
  updated: "",
  headings: [],
  readingMinutes: 1,
  path: "",
});

const section = (articles: string[], groups?: string[]): HelpSection => ({
  id: "calendario",
  title: "Calendario",
  description: "",
  icon: "calendar",
  order: 50,
  groups,
  articles,
});

describe("groupSectionArticles", () => {
  test("una sección sin subgrupos devuelve un solo grupo sin título, con los artículos en orden", () => {
    const articles = { "calendario/a": meta("calendario/a"), "calendario/b": meta("calendario/b") };
    const groups = groupSectionArticles(section(["calendario/a", "calendario/b"]), { articles });
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("");
    expect(groups[0].articles.map((article) => article.id)).toEqual(["calendario/a", "calendario/b"]);
  });

  test("reparte en los subgrupos declarados, en su orden, y omite los vacíos", () => {
    const articles = {
      "calendario/cobrar": meta("calendario/cobrar", "Cobrar y vender"),
      "calendario/crear": meta("calendario/crear", "Agendar"),
      "calendario/ver": meta("calendario/ver", "Conoce el calendario"),
    };
    const groups = groupSectionArticles(
      section(["calendario/ver", "calendario/crear", "calendario/cobrar"], ["Conoce el calendario", "Agendar", "Atender una cita", "Cobrar y vender"]),
      { articles }
    );
    expect(groups.map((group) => group.title)).toEqual(["Conoce el calendario", "Agendar", "Cobrar y vender"]);
    expect(groups[1]).toMatchObject({ id: "agendar", articles: [articles["calendario/crear"]] });
  });

  test("un artículo con un grupo no declarado no se pierde: va al final", () => {
    const articles = { "calendario/a": meta("calendario/a", "Agendar"), "calendario/x": meta("calendario/x", "Otro") };
    const groups = groupSectionArticles(section(["calendario/a", "calendario/x"], ["Agendar", "Cobrar"]), { articles });
    expect(groups.map((group) => group.title)).toEqual(["Agendar", "Otro"]);
  });
});
