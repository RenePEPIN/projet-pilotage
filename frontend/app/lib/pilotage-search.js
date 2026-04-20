/**
 * Recherche transversale côté client (pas de paramètre q côté API).
 */

export function normalizeSearchQuery(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * @param {object} task - tâche UI (titre, description, section, projectId…)
 * @param {string} normalizedQuery - résultat de normalizeSearchQuery
 * @param {string} [projectName] - nom lisible du projet
 */
export function taskMatchesNormalizedQuery(task, normalizedQuery, projectName) {
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    task.titre,
    task.description,
    task.section,
    String(task.projectId || ""),
    projectName,
  ];

  return haystacks.some((chunk) => {
    if (chunk == null || chunk === "") {
      return false;
    }
    const n = normalizeSearchQuery(String(chunk));
    return n.includes(normalizedQuery);
  });
}

export function filterTasksBySearchQuery(tasks, rawQuery, projectNameById) {
  const nq = normalizeSearchQuery(rawQuery);
  if (!nq) {
    return tasks;
  }
  return tasks.filter((t) =>
    taskMatchesNormalizedQuery(t, nq, projectNameById.get(String(t.projectId))),
  );
}
