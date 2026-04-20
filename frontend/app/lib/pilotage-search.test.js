import { describe, expect, it } from "vitest";
import {
  filterTasksBySearchQuery,
  normalizeSearchQuery,
  taskMatchesNormalizedQuery,
} from "./pilotage-search";

describe("pilotage-search", () => {
  it("normalise les accents et la casse", () => {
    expect(normalizeSearchQuery("  Café  ")).toBe("cafe");
  });

  it("filtre par titre et nom de projet", () => {
    const tasks = [
      {
        id: "1",
        titre: "API cache",
        description: "",
        section: "backend",
        projectId: "p1",
      },
    ];
    const names = new Map([["p1", "Projet Alpha"]]);
    const out = filterTasksBySearchQuery(tasks, "alpha", names);
    expect(out).toHaveLength(1);
    const out2 = filterTasksBySearchQuery(tasks, "beta", names);
    expect(out2).toHaveLength(0);
  });

  it("taskMatchesNormalizedQuery sans requête renvoie true", () => {
    expect(taskMatchesNormalizedQuery({ titre: "x" }, "", "P")).toBe(true);
  });
});
