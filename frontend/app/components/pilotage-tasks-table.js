"use client";

import Link from "next/link";
import { STATUS_FILTER_LABELS } from "../lib/board-constants";
import { projectLabel } from "../lib/pilotage-project-helpers";
import { toUiStatus } from "../lib/status-utils";

/**
 * Tableau tâches (recherche globale / backlog) — présentation uniquement.
 */
export function PilotageTasksTable({ tasks, projectById, caption }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="table-scroll">
      <table className="todo-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Projet</th>
            <th>Categorie</th>
            <th>Statut</th>
            <th>Echeance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((tache) => (
            <tr key={`${tache.projectId}-${tache.id}`}>
              <td>{tache.titre}</td>
              <td>
                <Link
                  href={`/projects/${encodeURIComponent(
                    tache.projectId,
                  )}/dashboard`}
                  className="text-link"
                >
                  {projectLabel(tache.projectId, projectById)}
                </Link>
              </td>
              <td>{tache.section || "autre"}</td>
              <td>
                <span className={`status-pill ${toUiStatus(tache.etat)}`}>
                  {STATUS_FILTER_LABELS[toUiStatus(tache.etat)] ??
                    toUiStatus(tache.etat)}
                </span>
              </td>
              <td>{tache.dueDate || "—"}</td>
              <td>
                <Link
                  href={`/detail?tache=${
                    tache.id
                  }&projectId=${encodeURIComponent(tache.projectId)}`}
                  className="action-link"
                >
                  Ouvrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
