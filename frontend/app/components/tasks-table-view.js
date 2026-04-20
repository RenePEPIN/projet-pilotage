"use client";

import Link from "next/link";
import { toUiStatus } from "../lib/status-utils";

export default function TasksTableView({
  activeProjectId,
  sortedVisibleTasks,
  statusFilterLabels,
}) {
  return (
    <section id="taches" className="kanban-panel">
      <div className="panel-head">
        <h2>Tableau — toutes les lignes</h2>
        <Link
          href={`/detail?projectId=${activeProjectId}`}
          className="panel-link primary-cta"
        >
          + Ajouter une tache
        </Link>
      </div>
      <div className="table-scroll board-table-scroll">
        <table className="todo-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Titre</th>
              <th scope="col">Statut</th>
              <th scope="col">Categorie</th>
              <th scope="col">Echeance</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedVisibleTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-list">
                  Aucune tache ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              sortedVisibleTasks.map((tache) => {
                const ui = toUiStatus(tache.etat);
                return (
                  <tr key={tache.id}>
                    <td>{tache.id}</td>
                    <td>{tache.titre}</td>
                    <td>
                      <span className={`status-badge ${ui}`}>
                        {statusFilterLabels[ui] ?? ui}
                      </span>
                    </td>
                    <td>{tache.section || "autre"}</td>
                    <td>{tache.dueDate || "—"}</td>
                    <td className="table-actions">
                      <Link
                        href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                        className="text-link"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
