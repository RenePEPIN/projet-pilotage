/**
 * Export CSV (séparateur ;) pour tableur FR — sans dépendance.
 */

function escapeCell(value) {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * @param {Array<object>} tasks - tâches UI
 * @param {Map<string,string>} projectNameById
 */
export function buildTasksCsv(tasks, projectNameById) {
  const headers = [
    "id",
    "titre",
    "statut",
    "categorie",
    "projet_id",
    "projet_nom",
    "echeance",
  ];
  const lines = [headers.join(";")];
  for (const t of tasks) {
    const pname = projectNameById.get(String(t.projectId)) || "";
    lines.push(
      [
        escapeCell(t.id),
        escapeCell(t.titre),
        escapeCell(t.etat),
        escapeCell(t.section || ""),
        escapeCell(t.projectId),
        escapeCell(pname),
        escapeCell(t.dueDate || ""),
      ].join(";"),
    );
  }
  return "\uFEFF" + lines.join("\n");
}

export function downloadTasksCsv(
  tasks,
  projectNameById,
  filename = "taches.csv",
) {
  const csv = buildTasksCsv(tasks, projectNameById);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
