import { describe, expect, it } from "vitest";

import { isTaskBlocked, sortTasksByDependencies } from "./task-dependency-ui";

describe("task dependency UI helpers", () => {
  it("marks a task blocked when its parent is in another status column", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "En cours", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
    ];

    expect(isTaskBlocked(allTasks[1], allTasks)).toBe(true);
  });

  it("does not inject hidden parent tasks into a status column sort", () => {
    const allTasks = [
      { id: "1", titre: "Parent", etat: "En cours", parentTaskId: null },
      { id: "2", titre: "Enfant", etat: "A faire", parentTaskId: "1" },
      { id: "3", titre: "Autre", etat: "A faire", parentTaskId: null },
    ];
    const aFaireTasks = [allTasks[1], allTasks[2]];

    const sorted = sortTasksByDependencies(aFaireTasks, allTasks);

    expect(sorted.map((task) => task.id)).toEqual(["2", "3"]);
  });
});
