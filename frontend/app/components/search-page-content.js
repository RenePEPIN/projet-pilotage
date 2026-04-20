"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { usePilotageGlobalTasks } from "../hooks/use-pilotage-global-tasks";
import { downloadTasksCsv } from "../lib/export-tasks-csv";
import { filterTasksBySearchQuery } from "../lib/pilotage-search";
import { projectLabel } from "../lib/pilotage-project-helpers";
import { toUiStatus } from "../lib/status-utils";
import { PilotageTasksTable } from "./pilotage-tasks-table";

export default function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const { projectById, projectError, tasks, tasksError, loadTasks, isLoading } =
    usePilotageGlobalTasks();

  const filtered = useMemo(() => {
    return filterTasksBySearchQuery(tasks, qParam, projectById);
  }, [tasks, qParam, projectById]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = projectLabel(a.projectId, projectById);
      const pb = projectLabel(b.projectId, projectById);
      if (pa !== pb) return String(pa).localeCompare(String(pb), "fr");
      return String(a.titre).localeCompare(String(b.titre), "fr");
    });
  }, [filtered, projectById]);

  function handleExportCsv() {
    downloadTasksCsv(sorted, projectById, "recherche-taches.csv");
  }

  return (
    <main className="travel-shell search-page">
      <section className="hero-block compact">
        <div className="topbar">
          <span className="brand">Recherche</span>
          <nav className="top-links" aria-label="Navigation">
            <Link href="/projects" className="panel-link">
              Projets
            </Link>
            <Link href="/backlog" className="panel-link">
              Backlog
            </Link>
          </nav>
        </div>
        <h1>Recherche globale</h1>
        <p className="hero-subtitle hero-subtitle-tight">
          Filtre les taches chargees depuis l&apos;API (titre, description,
          categorie, identifiant ou nom de projet). Utilisez aussi la barre de
          recherche en haut de l&apos;application.
        </p>
      </section>

      <section className="todo-panel">
        <div className="search-toolbar" role="toolbar" aria-label="Recherche">
          <form
            className="search-toolbar-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const raw = String(fd.get("q") || "").trim();
              router.push(
                raw ? `/search?q=${encodeURIComponent(raw)}` : "/search",
              );
            }}
          >
            <label htmlFor="search-page-q" className="segment-label">
              Terme
            </label>
            <input
              id="search-page-q"
              name="q"
              type="search"
              className="ui-input search-toolbar-input"
              defaultValue={qParam}
              placeholder="Ex. API, echeance, backend…"
              aria-describedby="search-page-help"
            />
            <button type="submit" className="ui-btn ui-btn-primary">
              Rechercher
            </button>
          </form>
          <p id="search-page-help" className="search-toolbar-help">
            La recherche s&apos;applique au jeu de taches deja charge (tous
            projets, pagination API bouclee).
          </p>
          <div className="search-toolbar-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => loadTasks()}
              disabled={isLoading}
            >
              {isLoading ? "Actualisation..." : "Recharger les donnees"}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={handleExportCsv}
              disabled={sorted.length === 0 || isLoading}
              title="Exporter les lignes affichees (filtre actif)"
            >
              Exporter CSV ({sorted.length})
            </button>
          </div>
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

        {isLoading && tasks.length === 0 ? (
          <p className="info-banner" role="status">
            Chargement des taches...
          </p>
        ) : null}

        {!isLoading && qParam && sorted.length === 0 ? (
          <p className="empty-column" role="status">
            Aucune tache ne correspond a « {qParam} ».
          </p>
        ) : null}

        {!qParam && !isLoading && tasks.length > 0 ? (
          <p className="info-banner" role="status">
            Saisissez un terme ci-dessus ou utilisez la barre de recherche du
            bandeau ({tasks.length} taches chargees).
          </p>
        ) : null}

        <PilotageTasksTable
          tasks={sorted}
          projectById={projectById}
          caption={`Resultats de recherche (${sorted.length} taches)`}
        />
      </section>
    </main>
  );
}
