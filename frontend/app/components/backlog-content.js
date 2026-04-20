"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { usePilotageGlobalTasks } from "../hooks/use-pilotage-global-tasks";
import { downloadTasksCsv } from "../lib/export-tasks-csv";
import { filterTasksBySearchQuery } from "../lib/pilotage-search";
import { projectLabel } from "../lib/pilotage-project-helpers";
import { toUiStatus } from "../lib/status-utils";
import { PilotageTasksTable } from "./pilotage-tasks-table";

const STATUS_SCOPE = {
  backlog: "aFaire",
  active: "active",
};

export default function BacklogContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const { projectById, projectError, tasks, tasksError, loadTasks, isLoading } =
    usePilotageGlobalTasks();

  const [statusScope, setStatusScope] = useState(STATUS_SCOPE.backlog);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const s = toUiStatus(t.etat);
      if (statusScope === STATUS_SCOPE.backlog) {
        return s === "aFaire";
      }
      return s === "aFaire" || s === "enCours";
    });
  }, [tasks, statusScope]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const pa = projectLabel(a.projectId, projectById);
      const pb = projectLabel(b.projectId, projectById);
      if (pa !== pb) return String(pa).localeCompare(String(pb), "fr");
      return String(a.titre).localeCompare(String(b.titre), "fr");
    });
  }, [filteredTasks, projectById]);

  const displayTasks = useMemo(() => {
    return filterTasksBySearchQuery(sortedTasks, qParam, projectById);
  }, [sortedTasks, qParam, projectById]);

  return (
    <main className="travel-shell backlog-page">
      <section className="hero-block compact">
        <div className="topbar">
          <span className="brand">Backlog</span>
          <nav className="top-links" aria-label="Navigation">
            <Link href="/projects" className="panel-link">
              Projets
            </Link>
          </nav>
        </div>
        <h1>Backlog transversal</h1>
        <p className="hero-subtitle hero-subtitle-tight">
          Toutes les taches « a traiter » sur l&apos;ensemble de vos projets
          (priorisation et tri transverses). Ajoutez{" "}
          <code className="inline-code">?q=</code> dans l&apos;URL ou utilisez
          la recherche globale pour filtrer ce tableau.
        </p>
      </section>

      <section className="todo-panel">
        <div className="backlog-toolbar" role="toolbar" aria-label="Portee">
          <span className="segment-label">Afficher</span>
          <div className="chip-row chip-row-inline">
            <button
              type="button"
              className={`chip chip-quiet${
                statusScope === STATUS_SCOPE.backlog ? " active" : ""
              }`}
              onClick={() => setStatusScope(STATUS_SCOPE.backlog)}
              aria-pressed={statusScope === STATUS_SCOPE.backlog}
            >
              A faire seulement
            </button>
            <button
              type="button"
              className={`chip chip-quiet${
                statusScope === STATUS_SCOPE.active ? " active" : ""
              }`}
              onClick={() => setStatusScope(STATUS_SCOPE.active)}
              aria-pressed={statusScope === STATUS_SCOPE.active}
            >
              A faire + en cours
            </button>
          </div>
          <button
            type="button"
            className="panel-link ui-btn ui-btn-secondary backlog-refresh"
            onClick={() => loadTasks()}
            disabled={isLoading}
          >
            {isLoading ? "Actualisation..." : "Actualiser"}
          </button>
          <button
            type="button"
            className="panel-link ui-btn ui-btn-secondary"
            onClick={() =>
              downloadTasksCsv(displayTasks, projectById, "backlog.csv")
            }
            disabled={displayTasks.length === 0 || isLoading}
            title="Exporter les lignes affichees (filtres portee + recherche)"
          >
            CSV ({displayTasks.length})
          </button>
        </div>

        {projectError ? (
          <p className="info-banner" role="alert">
            {projectError}
          </p>
        ) : null}
        {tasksError ? (
          <p className="info-banner" role="alert">
            {tasksError}
          </p>
        ) : null}

        {qParam ? (
          <p className="info-banner" role="status">
            Filtre URL <strong>q={qParam}</strong> — {displayTasks.length}{" "}
            tache(s) affichee(s).
          </p>
        ) : null}

        {isLoading && tasks.length === 0 ? (
          <p className="info-banner" role="status">
            Chargement du backlog...
          </p>
        ) : null}

        {!isLoading && sortedTasks.length === 0 ? (
          <p className="empty-column">
            Aucune tache dans cette portee. Les taches terminees ne figurent pas
            au backlog.
          </p>
        ) : null}

        {!isLoading && sortedTasks.length > 0 && displayTasks.length === 0 ? (
          <p className="empty-column" role="status">
            Aucune tache ne correspond au filtre de recherche « {qParam} ».
          </p>
        ) : null}

        <PilotageTasksTable
          tasks={displayTasks}
          projectById={projectById}
          caption={`Backlog (${displayTasks.length} taches affichees)`}
        />
      </section>
    </main>
  );
}
