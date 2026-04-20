"use client";

import Link from "next/link";
import { useState } from "react";
import { useProjects } from "../hooks/use-projects";
import { createProject, renameProject } from "../lib/project-api";
import { STORAGE_ACTIVE_PROJECT_KEY } from "./category-constants";

export default function ProjectsPageContent() {
  const { projects, isLoadingProjects, projectError, refreshProjects } =
    useProjects({
      decorateProject: (project) => ({ ...project, createdAt: "API" }),
    });
  const [newProjectName, setNewProjectName] = useState("");
  const [editingNames, setEditingNames] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState("");

  async function addProject(event) {
    event.preventDefault();
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setIsCreatingProject(true);
      setErrorMessage("");
      const createdProject = await createProject(trimmedName);
      await refreshProjects();
      window.localStorage.setItem(
        STORAGE_ACTIVE_PROJECT_KEY,
        createdProject.id,
      );
      setNewProjectName("");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Creation impossible. Verifie que l'API tourne.";
      setErrorMessage(message);
    } finally {
      setIsCreatingProject(false);
    }
  }

  function updateEditName(projectId, value) {
    setEditingNames((prev) => ({ ...prev, [projectId]: value }));
  }

  async function saveProjectName(projectId) {
    const nextName = (editingNames[projectId] || "").trim();
    if (!nextName) {
      setErrorMessage("Le nom du projet ne peut pas etre vide.");
      return;
    }

    try {
      setRenamingProjectId(projectId);
      setErrorMessage("");
      const updated = await renameProject(projectId, nextName);
      await refreshProjects();
      setEditingNames((prev) => {
        const next = { ...prev };
        next[projectId] = updated.name;
        return next;
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Renommage impossible. Verifie que l'API tourne.";
      setErrorMessage(message);
    } finally {
      setRenamingProjectId("");
    }
  }

  return (
    <main className="travel-shell">
      <section className="hero-block">
        <div className="topbar">
          <span className="brand">App de pilotage</span>
          <nav className="top-links" aria-label="Navigation principale">
            <Link
              href="/projects/projet-api-principal"
              className="panel-link"
              onClick={() =>
                window.localStorage.setItem(
                  STORAGE_ACTIVE_PROJECT_KEY,
                  "projet-api-principal",
                )
              }
            >
              Retour
            </Link>
            <Link href="/projects">Projets</Link>
          </nav>
        </div>

        <h1>App de pilotage</h1>
        <p className="hero-subtitle">
          Le projet API est un projet parmi les autres dans ton app de pilotage.
        </p>
      </section>

      <section className="todo-panel" id="projets">
        <div className="panel-head">
          <h2>Liste des projets</h2>
        </div>

        {isLoadingProjects ? (
          <p className="info-banner">Chargement des projets...</p>
        ) : null}

        {projectError ? <p className="info-banner">{projectError}</p> : null}

        {errorMessage ? <p className="info-banner">{errorMessage}</p> : null}

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <h3>{project.name}</h3>
              <div className="add-category-form project-rename-row">
                <input
                  className="ui-input"
                  type="text"
                  value={editingNames[project.id] ?? project.name}
                  onChange={(event) =>
                    updateEditName(project.id, event.target.value)
                  }
                  aria-label={`Nom du projet ${project.name}`}
                />
                <button
                  type="button"
                  className="panel-link ui-btn ui-btn-secondary"
                  onClick={() => saveProjectName(project.id)}
                  disabled={renamingProjectId === project.id}
                >
                  {renamingProjectId === project.id
                    ? "Renommage..."
                    : "Renommer"}
                </button>
              </div>
              <p className="project-meta">Cree le: {project.createdAt}</p>
              <Link
                href={`/projects/${project.id}`}
                className="action-link ui-btn ui-btn-secondary"
                onClick={() =>
                  window.localStorage.setItem(
                    STORAGE_ACTIVE_PROJECT_KEY,
                    project.id,
                  )
                }
              >
                Ouvrir les taches
              </Link>
            </article>
          ))}
        </div>

        <form className="add-category-form" onSubmit={addProject}>
          <input
            className="ui-input"
            type="text"
            placeholder="Nouveau projet (ex: API Ecommerce, CRM Interne)"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            disabled={isCreatingProject}
          />
          <button
            type="submit"
            className="primary-cta small ui-btn ui-btn-primary"
            disabled={isCreatingProject}
          >
            {isCreatingProject ? "Creation..." : "Ajouter projet"}
          </button>
        </form>
      </section>
    </main>
  );
}
