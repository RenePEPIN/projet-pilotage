"use client";

import Link from "next/link";
import { toUiStatus } from "../lib/status-utils";
import { getShortDescription, getStatusLabel } from "./task-category-display";

/**
 * Vue liste / tableau par catégorie (hors colonnes Kanban).
 */
export function TaskCategoryListTable({
  categoryKey,
  categoryLabel,
  activeProjectId,
  categoryLabels = {},
  updateCategoryLabel = () => {},
  tasks,
  onDeleteTask,
}) {
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
                    <span className={`status-pill ${toUiStatus(tache.etat)}`}>
                      {getStatusLabel(tache.etat)}
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
