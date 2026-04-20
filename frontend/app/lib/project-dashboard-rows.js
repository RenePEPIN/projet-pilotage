import { toUiStatus } from "./status-utils";

/**
 * Construit les lignes du tableau categorie x statuts (aligne sur le filtre categorie du board).
 */
export function buildDashboardCategoryRows({
  visibleTasks,
  categoryOrder,
  categoryLabels,
}) {
  const normalize = (tache) =>
    String(tache.section || "autre")
      .trim()
      .toLowerCase();

  const counts = new Map();
  for (const tache of visibleTasks) {
    const sec = normalize(tache);
    if (!counts.has(sec)) {
      counts.set(sec, { aFaire: 0, enCours: 0, terminee: 0 });
    }
    const status = toUiStatus(tache.etat);
    const row = counts.get(sec);
    if (row[status] !== undefined) {
      row[status] += 1;
    }
  }

  const ordered = [];
  const seen = new Set();

  for (const key of categoryOrder) {
    if (!counts.has(key)) {
      continue;
    }
    ordered.push({
      key,
      label: categoryLabels[key] || key,
      ...counts.get(key),
    });
    seen.add(key);
  }

  for (const key of counts.keys()) {
    if (seen.has(key)) {
      continue;
    }
    ordered.push({
      key,
      label: categoryLabels[key] || key,
      ...counts.get(key),
    });
  }

  return ordered;
}
