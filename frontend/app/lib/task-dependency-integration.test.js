/**
 * Tests d'integration du flux parent-enfant (frontend).
 *
 * Couvre les scenarios manquants :
 * - isTaskBlocked quand le parent est Terminee (non bloque)
 * - isTaskBlocked avec chaine multi-niveaux
 * - sortTasksByDependencies avec chaine profonde
 * - sortTasksByDependencies resilient aux cycles
 * - Cas limites (parentTaskId absent, tache orpheline)
 */

import { describe, expect, it } from "vitest";

import { isTaskBlocked, sortTasksByDependencies } from "./task-dependency-ui";

describe("integration parent-enfant", () => {
  // ---------- isTaskBlocked ----------

  it("n'est PAS bloque quand le parent est Terminee", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "Terminee", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
    ];

    expect(isTaskBlocked(allTasks[1], allTasks)).toBe(false);
  });

  it("est bloque quand le parent est En cours", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "En cours", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
    ];

    expect(isTaskBlocked(allTasks[1], allTasks)).toBe(true);
  });

  it("est bloque quand le parent est A faire", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "A faire", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
    ];

    expect(isTaskBlocked(allTasks[1], allTasks)).toBe(true);
  });

  it("n'est pas bloque quand parentTaskId est null", () => {
    const task = {
      id: "1",
      titre: "Orphelin",
      etat: "A faire",
      parentTaskId: null,
    };
    expect(isTaskBlocked(task, [task])).toBe(false);
  });

  it("n'est pas bloque quand le parent n'existe pas dans la liste", () => {
    const task = {
      id: "2",
      titre: "Orphelin",
      etat: "A faire",
      parentTaskId: "999",
    };
    expect(isTaskBlocked(task, [task])).toBe(false);
  });

  // ---------- sortTasksByDependencies ----------

  it("trie une chaine de 4 niveaux dans l'ordre parent-first", () => {
    const allTasks = [
      {
        id: "4",
        titre: "Arriere-petit-enfant",
        etat: "A faire",
        parentTaskId: "3",
      },
      { id: "2", titre: "Parent", etat: "A faire", parentTaskId: "1" },
      { id: "1", titre: "Grand-parent", etat: "A faire", parentTaskId: null },
      { id: "3", titre: "Enfant", etat: "A faire", parentTaskId: "2" },
    ];

    const sorted = sortTasksByDependencies(allTasks, allTasks);

    expect(sorted.map((t) => t.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("ne plante pas sur un cycle (A→B→A)", () => {
    const allTasks = [
      { id: "1", titre: "A", etat: "A faire", parentTaskId: "2" },
      { id: "2", titre: "B", etat: "A faire", parentTaskId: "1" },
    ];

    // Ne doit pas boucler infiniment
    const sorted = sortTasksByDependencies(allTasks, allTasks);

    expect(sorted).toHaveLength(2);
    expect(new Set(sorted.map((t) => t.id))).toEqual(new Set(["1", "2"]));
  });

  it("gere un mix de taches avec et sans parent", () => {
    const allTasks = [
      { id: "3", titre: "Orphelin", etat: "A faire", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
      { id: "1", titre: "Parent", etat: "En cours", parentTaskId: null },
    ];

    const sorted = sortTasksByDependencies(allTasks, allTasks);
    const ids = sorted.map((t) => t.id);

    // Parent doit apparaitre avant Enfant
    expect(ids.indexOf("1")).toBeLessThan(ids.indexOf("2"));
    // Toutes les taches presentes
    expect(sorted).toHaveLength(3);
  });

  it("filtre uniquement les taches demandees (pas les parents cross-colonne)", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "Terminee", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
      { id: "3", titre: "Independant", etat: "A faire", parentTaskId: null },
    ];
    // Seules les taches "A faire"
    const tasksToSort = [allTasks[1], allTasks[2]];

    const sorted = sortTasksByDependencies(tasksToSort, allTasks);

    expect(sorted.map((t) => t.id)).toEqual(["2", "3"]);
    // Le parent Terminee ne doit PAS apparaitre
    expect(sorted.find((t) => t.id === "1")).toBeUndefined();
  });

  it("retourne un tableau vide pour une entree vide", () => {
    expect(sortTasksByDependencies([], [])).toEqual([]);
  });
});
