import { describe, expect, it } from "vitest";
import { buildDashboardCategoryRows } from "./project-dashboard-rows";

describe("buildDashboardCategoryRows", () => {
  it("agrege les taches par cle de categorie et statut", () => {
    const rows = buildDashboardCategoryRows({
      visibleTasks: [
        { section: "backend", etat: "A faire" },
        { section: "backend", etat: "En cours" },
        { section: "frontend", etat: "Terminee" },
      ],
      categoryOrder: ["backend", "frontend"],
      categoryLabels: { backend: "Backend", frontend: "Frontend" },
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      key: "backend",
      label: "Backend",
      aFaire: 1,
      enCours: 1,
      terminee: 0,
    });
    expect(rows[1]).toMatchObject({
      key: "frontend",
      label: "Frontend",
      aFaire: 0,
      enCours: 0,
      terminee: 1,
    });
  });

  it("inclut une categorie hors ordre declare en fin de liste", () => {
    const rows = buildDashboardCategoryRows({
      visibleTasks: [{ section: "nouvelle", etat: "A faire" }],
      categoryOrder: ["backend"],
      categoryLabels: { nouvelle: "Nouvelle" },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: "nouvelle",
      label: "Nouvelle",
      aFaire: 1,
      enCours: 0,
      terminee: 0,
    });
  });
});
