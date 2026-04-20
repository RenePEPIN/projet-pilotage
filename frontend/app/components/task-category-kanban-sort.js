/**
 * Ordre des cartes dans une colonne Kanban (dépendances puis tri utilisateur).
 */

import { sortTasksByDependencies } from "../lib/task-dependency-ui";

export function sortKanbanTasksForColumn(tasks, allTasks, sortBy) {
  const sortedByDeps = sortTasksByDependencies(tasks, allTasks);

  let sortedTasks = sortedByDeps.sort((a, b) => {
    if (a.parentTaskId === b.parentTaskId) {
      const sectionA = (a.section || "autre").toLowerCase();
      const sectionB = (b.section || "autre").toLowerCase();

      if (sectionA !== sectionB) {
        return sectionA.localeCompare(sectionB);
      }

      return a.id - b.id;
    }

    return 0;
  });

  if (sortBy === "title") {
    sortedTasks = [...sortedTasks].sort((a, b) =>
      a.titre.localeCompare(b.titre, "fr"),
    );
  } else if (sortBy === "due") {
    sortedTasks = [...sortedTasks].sort((a, b) => {
      const da = a.dueDate || "";
      const db = b.dueDate || "";
      if (da === db) return Number(a.id) - Number(b.id);
      return da.localeCompare(db);
    });
  } else if (sortBy === "id") {
    sortedTasks = [...sortedTasks].sort((a, b) => Number(a.id) - Number(b.id));
  }

  return sortedTasks;
}
