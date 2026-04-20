"use client";

import Link from "next/link";

const STATUS_KEYS = ["aFaire", "enCours", "terminee"];

export default function TasksListView({
  activeProjectId,
  groupedForListView,
  statusFilterLabels,
}) {
  return (
    <section id="taches" className="kanban-panel">
      <div className="panel-head">
        <h2>Liste — par statut</h2>
        <Link
          href={`/detail?projectId=${activeProjectId}`}
          className="panel-link primary-cta"
        >
          + Ajouter une tache
        </Link>
      </div>
      <div className="split-lists">
        {STATUS_KEYS.map((statusKey) => (
          <div className="list-column" key={statusKey}>
            <h3>{statusFilterLabels[statusKey]}</h3>
            {groupedForListView[statusKey].length === 0 ? (
              <p className="empty-list">Aucune tache.</p>
            ) : (
              <ul className="list-compact">
                {groupedForListView[statusKey].map((tache) => (
                  <li key={tache.id} className="list-compact-item">
                    <Link
                      href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                      className="list-compact-title"
                    >
                      {tache.titre}
                    </Link>
                    <span className="list-compact-meta">
                      {tache.section || "autre"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
