"use client";

import Link from "next/link";
import { useMemo } from "react";
import { STATUS_FILTER_LABELS } from "../hooks/use-project-board-state";
import { buildDashboardCategoryRows } from "../lib/project-dashboard-rows";

const VIEW_LINKS = [
  {
    segment: "kanban",
    label: "Kanban",
    description: "Colonnes par statut et glisser-deposer.",
    actionLabel: "Ouvrir le Kanban",
  },
  {
    segment: "table",
    label: "Lignes",
    description: "Toutes les taches en lignes (tableau pagine).",
    actionLabel: "Ouvrir la vue lignes",
  },
  {
    segment: "calendar",
    label: "Calendrier",
    description: "Echeances et charge sur la periode.",
    actionLabel: "Ouvrir le calendrier",
  },
  {
    segment: "list",
    label: "Liste",
    description: "Vue compacte groupee par statut.",
    actionLabel: "Ouvrir la liste",
  },
];

/**
 * Vue synthese projet : liens vers les modes de travail et repartition par categorie.
 */
export function ProjectDashboardView({
  activeProjectId,
  visibleTasks,
  categoryOrder,
  categoryLabels,
}) {
  const categoryRows = useMemo(
    () =>
      buildDashboardCategoryRows({
        visibleTasks,
        categoryOrder,
        categoryLabels,
      }),
    [visibleTasks, categoryOrder, categoryLabels],
  );

  if (!activeProjectId) {
    return (
      <p className="info-banner" role="status">
        Selection ou chargement du projet en cours...
      </p>
    );
  }

  const base = `/projects/${activeProjectId}`;

  return (
    <div className="project-dashboard-root">
      <section
        className="todo-panel"
        aria-labelledby="project-dashboard-views-title"
      >
        <div className="panel-head">
          <h2 id="project-dashboard-views-title">Acces aux vues</h2>
        </div>
        <p className="project-dashboard-lead">
          Choisis un mode de travail ; les filtres et la pagination du bandeau
          ci-dessus s&apos;appliquent aux indicateurs et au tableau ci-dessous.
        </p>
        <div className="project-grid">
          {VIEW_LINKS.map(({ segment, label, description, actionLabel }) => (
            <article key={segment} className="project-card">
              <h3>{label}</h3>
              <p className="project-meta">{description}</p>
              <Link
                href={`${base}/${segment}`}
                className="action-link ui-btn ui-btn-secondary"
              >
                {actionLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        className="todo-panel project-dashboard-categories"
        aria-labelledby="project-dashboard-cat-title"
      >
        <div className="panel-head">
          <h2 id="project-dashboard-cat-title">
            Repartition par categorie (filtres actifs)
          </h2>
        </div>

        {categoryRows.length === 0 ? (
          <p className="info-banner" role="status">
            Aucune tache ne correspond aux filtres sur cette page.
          </p>
        ) : (
          <div className="table-scroll board-table-scroll">
            <table className="todo-table">
              <thead>
                <tr>
                  <th scope="col">Categorie</th>
                  <th scope="col">{STATUS_FILTER_LABELS.aFaire}</th>
                  <th scope="col">{STATUS_FILTER_LABELS.enCours}</th>
                  <th scope="col">{STATUS_FILTER_LABELS.terminee}</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>{row.aFaire}</td>
                    <td>{row.enCours}</td>
                    <td>{row.terminee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
