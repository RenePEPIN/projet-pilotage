import Link from "next/link";
import {
  isTaskBlocked,
  sortTasksByDependencies,
} from "../lib/task-dependency-ui";
import { toUiStatus } from "../lib/status-utils";

export default function TaskCategorySection({
  categoryKey,
  categoryLabel,
  activeProjectId,
  categoryLabels,
  updateCategoryLabel,
  tasks,
  allTasks = tasks,
  onDeleteTask,
  isKanbanColumn = false,
}) {
  function getShortDescription(value) {
    const text = (value || "").trim();
    if (text.length <= 90) {
      return text || "Sans description";
    }
    return `${text.slice(0, 87)}...`;
  }

  function getStatusLabel(etat) {
    const labels = {
      aFaire: "A faire",
      enCours: "En cours",
      terminee: "Terminees",
    };
    return labels[toUiStatus(etat)] || etat;
  }

  // Kanban column mode (grouped by status)
  if (isKanbanColumn) {
    // First: sort by dependencies (topological sort)
    const sortedByDeps = sortTasksByDependencies(tasks, allTasks);

    // Second: sort by section/category within each dependency chain
    const sortedTasks = sortedByDeps.sort((a, b) => {
      // If same parent, sort by section
      if (a.parentTaskId === b.parentTaskId) {
        const sectionA = (a.section || "autre").toLowerCase();
        const sectionB = (b.section || "autre").toLowerCase();

        if (sectionA !== sectionB) {
          return sectionA.localeCompare(sectionB);
        }

        // Same section: preserve natural order
        return a.id - b.id;
      }

      // Different dependency chains: keep topological order
      return 0;
    });

    const headingId = `kanban-col-${categoryKey}`;

    return (
      <section className="kanban-column" aria-labelledby={headingId}>
        <div className="kanban-column-head">
          <h3 id={headingId}>{categoryLabel}</h3>
          <span className="kanban-count" aria-label={`${tasks.length} taches`}>
            {tasks.length}
          </span>
        </div>

        <div className="kanban-column-content" role="list">
          {tasks.length === 0 ? (
            <p className="empty-column">Aucune tache</p>
          ) : (
            <div className="task-cards">
              {sortedTasks.map((tache) => (
                <article
                  key={tache.id}
                  role="listitem"
                  aria-label={`Tache ${tache.titre}`}
                  className={`task-card ${isTaskBlocked(tache, allTasks) ? "task-blocked" : ""}`}
                >
                  <div className="task-card-head">
                    <h4 className="task-title">{tache.titre}</h4>
                    <span className={`status-badge ${toUiStatus(tache.etat)}`}>
                      {getStatusLabel(tache.etat)}
                    </span>
                  </div>

                  {isTaskBlocked(tache, allTasks) && (
                    <div className="task-blocked-indicator">
                      <span className="blocked-badge">🔒 Dépendance</span>
                    </div>
                  )}

                  <div className="task-card-meta">
                    <span className="category-badge">
                      {tache.section || "autre"}
                    </span>
                  </div>

                  <p className="task-description">
                    {getShortDescription(tache.description)}
                  </p>

                  <div className="task-card-actions">
                    <Link
                      href={`?guide=${tache.id}&projectId=${activeProjectId}#guide-modal`}
                      className="action-link guide ui-btn ui-btn-guide"
                    >
                      Guide
                    </Link>
                    <Link
                      href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                      className="action-link modify ui-btn ui-btn-secondary"
                    >
                      Modifier
                    </Link>
                    <button
                      type="button"
                      className="action-link delete ui-btn ui-btn-danger"
                      onClick={() => onDeleteTask(tache.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Legacy table mode (grouped by section/category)
  return (
    <section className="list-column" key={categoryKey}>
      <div className="category-card-head">
        <h3>{categoryLabel}</h3>
        <input
          className="inline-category-title"
          type="text"
          value={categoryLabels[categoryKey] ?? categoryKey}
          onChange={(event) =>
            updateCategoryLabel(categoryKey, event.target.value)
          }
          aria-label={`Renommer la categorie ${categoryLabel}`}
        />
      </div>

      {tasks.length === 0 ? (
        <p className="empty-list">Aucune tache dans cette categorie.</p>
      ) : (
        <div className="table-scroll">
          <table className="todo-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Description</th>
                <th>Etat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((tache) => (
                <tr key={tache.id}>
                  <td>{tache.titre}</td>
                  <td>
                    <Link
                      href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                      className="text-link"
                    >
                      {getShortDescription(tache.description)}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-pill ${tache.etat}`}>
                      {tache.etat}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`?guide=${tache.id}&projectId=${activeProjectId}#guide-modal`}
                        className="action-link guide"
                      >
                        Guide
                      </Link>
                      <Link
                        href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                        className="action-link"
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        className="action-link danger"
                        onClick={() => onDeleteTask(tache.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
