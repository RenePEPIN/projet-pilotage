"use client";

import Link from "next/link";
import ProjectViewTabs from "./project-view-tabs";
import { VIEW_SUBTITLES } from "./home-content-build-info";

/**
 * En-tête du tableau de bord projet : navigation, titre, sélecteur de projet, lien nouvelle tâche, onglets de vue.
 */
export function HomeContentHero({
  router,
  activeProjectName,
  activeView,
  activeProjectId,
  projects,
  setActiveProjectId,
}) {
  return (
    <>
      <div className="topbar">
        <span className="brand">App de pilotage</span>
        <nav className="top-links" aria-label="Navigation hors projet">
          <Link href="/projects">Liste des projets</Link>
        </nav>
      </div>

      <div className="project-hero">
        <div className="project-hero-main">
          <h1 id="board-project-title">{activeProjectName}</h1>
          <p className="hero-subtitle hero-subtitle-tight">
            {VIEW_SUBTITLES[activeView] ?? VIEW_SUBTITLES.kanban}
          </p>
        </div>
        <div className="project-hero-actions">
          {projects.length > 1 ? (
            <label className="project-picker-wrap">
              <span className="segment-label">Projet</span>
              <select
                className="ui-select project-picker"
                value={activeProjectId ?? ""}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setActiveProjectId(nextId);
                  router.push(`/projects/${nextId}/${activeView}`);
                }}
                aria-label="Changer de projet actif"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Link
            href={`/detail?projectId=${activeProjectId}`}
            className="primary-cta primary-cta-board"
          >
            + Nouvelle tache
          </Link>
        </div>
      </div>

      {activeProjectId ? <ProjectViewTabs projectId={activeProjectId} /> : null}
    </>
  );
}
