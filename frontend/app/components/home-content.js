"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../hooks/use-projects";
import {
  buildPaginationUi,
  buildTruncationMessage,
} from "../lib/home-content-ui";
import { toUiStatus } from "../lib/status-utils";
import { deleteTask, getTasksByProjectId } from "../lib/task-api";
import CategoryManager from "./category-manager";
import {
  DEFAULT_CATEGORY_LABELS,
  slugify,
  STORAGE_ACTIVE_PROJECT_KEY,
  STORAGE_LABELS_KEY,
  STORAGE_ORDER_KEY,
} from "./category-constants";
import GuideModal from "./guide-modal";
import ProjectCalendar from "./project-calendar";
import TaskCategorySection from "./task-category-section";

const TASKS_PAGE_SIZE = 100;

function buildInfo(searchParams) {
  if (searchParams.get("modifier")) {
    return `La tache ${searchParams.get("modifier")} a ete modifiee avec succes`;
  }
  if (searchParams.get("annulerModifier")) {
    return `La tache ${searchParams.get("annulerModifier")} n'a pas ete modifiee`;
  }
  if (searchParams.get("ajouter")) {
    const sectionLabel = searchParams.get("sectionLabel");
    const section = searchParams.get("section");
    const projectName = searchParams.get("projectName");
    const projectSuffix = projectName ? ` - projet ${projectName}` : "";
    if (sectionLabel) {
      return `La tache ${searchParams.get("ajouter")} a ete ajoutee avec succes (${sectionLabel}${projectSuffix})`;
    }
    if (section) {
      return `La tache ${searchParams.get("ajouter")} a ete ajoutee avec succes (${section}${projectSuffix})`;
    }
    return `La tache ${searchParams.get("ajouter")} a ete ajoutee avec succes${projectSuffix}`;
  }
  if (searchParams.get("annulerAjouter")) {
    return "Aucune tache n'a ete ajoutee, creation annulee";
  }
  if (searchParams.get("supprimerTache")) {
    return `La tache ${searchParams.get("supprimerTache")} a ete supprimee avec succes`;
  }
  return "";
}

export default function HomeContent({ initialProjectId }) {
  const searchParams = useSearchParams();
  const info = useMemo(() => buildInfo(searchParams), [searchParams]);
  const guideId = searchParams.get("guide");

  const [categoryLabels, setCategoryLabels] = useState(DEFAULT_CATEGORY_LABELS);
  const [categoryOrder, setCategoryOrder] = useState(
    Object.keys(DEFAULT_CATEGORY_LABELS),
  );
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const { projects, isLoadingProjects, projectError } = useProjects({
    decorateProject: (project) => ({ ...project, createdAt: "API" }),
  });
  const [activeProjectId, setActiveProjectId] = useState(
    initialProjectId || null,
  );
  const [tasksOffset, setTasksOffset] = useState(0);
  const [tasksReloadTick, setTasksReloadTick] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [taskPagination, setTaskPagination] = useState({
    limit: TASKS_PAGE_SIZE,
    offset: 0,
    count: 0,
    truncated: false,
  });
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [actionInfo, setActionInfo] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return;
    }

    if (
      initialProjectId &&
      projects.some((project) => project.id === initialProjectId)
    ) {
      setActiveProjectId(initialProjectId);
      return;
    }

    setActiveProjectId((prev) => {
      if (projects.some((project) => project.id === prev)) {
        return prev;
      }
      return projects[0].id;
    });
  }, [initialProjectId, projects]);

  useEffect(() => {
    setTasksOffset(0);
  }, [activeProjectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadTasksForProject() {
      if (!activeProjectId) {
        setTasks([]);
        setTaskPagination({
          limit: TASKS_PAGE_SIZE,
          offset: 0,
          count: 0,
          truncated: false,
        });
        return;
      }

      try {
        setIsLoadingTasks(true);
        setTaskError("");
        const nextTasks = await getTasksByProjectId(activeProjectId, {
          limit: TASKS_PAGE_SIZE,
          offset: tasksOffset,
          includeMeta: true,
        });
        if (isMounted) {
          // If current page became empty after changes, fallback to previous page.
          if (
            nextTasks.tasks.length === 0 &&
            nextTasks.pagination.count > 0 &&
            tasksOffset > 0
          ) {
            setTasksOffset((prev) => Math.max(0, prev - TASKS_PAGE_SIZE));
            return;
          }
          setTasks(nextTasks.tasks);
          setTaskPagination(nextTasks.pagination);
        }
      } catch {
        if (isMounted) {
          setTaskError("Impossible de charger les taches depuis l'API.");
          setTaskPagination((prev) => ({ ...prev, truncated: false }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false);
        }
      }
    }

    loadTasksForProject();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId, tasksOffset, tasksReloadTick]);

  useEffect(() => {
    const storedLabels = window.localStorage.getItem(STORAGE_LABELS_KEY);
    const storedOrder = window.localStorage.getItem(STORAGE_ORDER_KEY);
    const storedActiveProject = window.localStorage.getItem(
      STORAGE_ACTIVE_PROJECT_KEY,
    );

    if (storedLabels) {
      try {
        setCategoryLabels((prev) => ({ ...prev, ...JSON.parse(storedLabels) }));
      } catch {
        // Ignore invalid localStorage payload
      }
    }

    if (storedOrder) {
      try {
        const parsedOrder = JSON.parse(storedOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
          setCategoryOrder(parsedOrder);
        }
      } catch {
        // Ignore invalid localStorage payload
      }
    }

    if (initialProjectId) {
      setActiveProjectId(initialProjectId);
    } else if (storedActiveProject) {
      setActiveProjectId(storedActiveProject);
    }
  }, [initialProjectId]);

  useEffect(() => {
    const missingCategories = tasks
      .map((tache) => tache.section || "autre")
      .filter((section, index, arr) => arr.indexOf(section) === index)
      .filter((section) => !categoryOrder.includes(section));

    if (missingCategories.length > 0) {
      setCategoryOrder((prev) => [...prev, ...missingCategories]);
      setCategoryLabels((prev) => {
        const next = { ...prev };
        missingCategories.forEach((section) => {
          if (!next[section]) {
            next[section] = section;
          }
        });
        return next;
      });
    }
  }, [categoryOrder, tasks]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_LABELS_KEY,
      JSON.stringify(categoryLabels),
    );
  }, [categoryLabels]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_ORDER_KEY,
      JSON.stringify(categoryOrder),
    );
  }, [categoryOrder]);

  useEffect(() => {
    if (!projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(projects[0]?.id || null);
      return;
    }
    window.localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, activeProjectId);
  }, [activeProjectId, projects]);

  const availableCategoryKeys = useMemo(() => {
    const taskSections = tasks
      .map((tache) => tache.section || "autre")
      .filter(
        (section, index, sections) => sections.indexOf(section) === index,
      );

    return categoryOrder.filter(
      (section) =>
        DEFAULT_CATEGORY_LABELS[section] || taskSections.includes(section),
    );
  }, [categoryOrder, tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((tache) => {
      const matchesStatus =
        statusFilter === null || toUiStatus(tache.etat) === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        (tache.section || "autre") === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, statusFilter, tasks]);

  const tacheGuide = tasks.find(
    (tache) => String(tache.id) === String(guideId),
  );

  // Group tasks by status for Kanban board layout
  const groupedTasksByStatus = useMemo(() => {
    const statuses = ["aFaire", "enCours", "terminee"];
    const groups = {};
    statuses.forEach((status) => {
      groups[status] = [];
    });

    visibleTasks.forEach((tache) => {
      const status = toUiStatus(tache.etat);
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(tache);
    });

    return groups;
  }, [visibleTasks]);

  const total = visibleTasks.length;
  const aFaire = visibleTasks.filter(
    (tache) => toUiStatus(tache.etat) === "aFaire",
  ).length;
  const enCours = visibleTasks.filter(
    (tache) => toUiStatus(tache.etat) === "enCours",
  ).length;
  const terminees = visibleTasks.filter(
    (tache) => toUiStatus(tache.etat) === "terminee",
  ).length;

  const truncationMessage = buildTruncationMessage({
    loadedCount: tasks.length,
    totalCount: taskPagination.count,
    truncated: taskPagination.truncated,
  });
  const paginationUi = buildPaginationUi({
    offset: taskPagination.offset,
    loadedCount: tasks.length,
    totalCount: taskPagination.count,
    pageSize: TASKS_PAGE_SIZE,
    isLoading: isLoadingTasks,
  });

  function goToPreviousPage() {
    setTasksOffset((prev) => Math.max(0, prev - TASKS_PAGE_SIZE));
  }

  function goToNextPage() {
    if (!paginationUi.canGoNext) {
      return;
    }
    setTasksOffset((prev) => prev + TASKS_PAGE_SIZE);
  }

  function updateCategoryLabel(key, nextLabel) {
    setCategoryLabels((prev) => ({ ...prev, [key]: nextLabel }));
  }

  function addCategory(event) {
    event.preventDefault();
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) {
      return;
    }

    let key = slugify(trimmed) || "categorie";
    let suffix = 2;

    while (categoryOrder.includes(key)) {
      key = `${slugify(trimmed) || "categorie"}-${suffix}`;
      suffix += 1;
    }

    setCategoryOrder((prev) => [...prev, key]);
    setCategoryLabels((prev) => ({ ...prev, [key]: trimmed }));
    setNewCategoryLabel("");
  }

  function resetCategoryLabels() {
    setCategoryLabels(DEFAULT_CATEGORY_LABELS);
    setCategoryOrder(Object.keys(DEFAULT_CATEGORY_LABELS));
    window.localStorage.removeItem(STORAGE_LABELS_KEY);
    window.localStorage.removeItem(STORAGE_ORDER_KEY);
  }

  const activeProjectName =
    projects.find((project) => project.id === activeProjectId)?.name ||
    "Projet actif";

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setActionInfo(`La tache ${taskId} a ete supprimee avec succes`);
      setTasksReloadTick((prev) => prev + 1);
    } catch {
      setTaskError("La suppression a echoue. Verifie que l'API tourne bien.");
    }
  }

  return (
    <main className="travel-shell">
      <section className="hero-block">
        <div className="topbar">
          <span className="brand">App de pilotage</span>
          <nav className="top-links" aria-label="Navigation principale">
            <Link href="/projects">Projets</Link>
            <a href="#calendrier">Calendrier</a>
            <a href="#categories">Categories</a>
            <a href="#taches">Taches</a>
          </nav>
        </div>

        <h1>App de pilotage</h1>
        <p className="hero-subtitle">
          Organise les taches Backend FastAPI et Frontend, puis personnalise les
          categories si besoin.
        </p>

        <p className="project-context">Projet ouvert: {activeProjectName}</p>

        <div
          className="search-bar"
          role="search"
          aria-label="Recherche de taches"
        >
          <div className="search-segment">
            <span className="segment-label">Recherche</span>
            <span className="segment-value">
              Quelle tache veux-tu retrouver ?
            </span>
          </div>
          <div className="search-segment">
            <span className="segment-label">Periode</span>
            <span className="segment-value">Semaine en cours</span>
          </div>
          <Link
            href={`/detail?projectId=${activeProjectId}`}
            className="primary-cta"
          >
            + Nouvelle tache
          </Link>
        </div>

        <div className="chip-row" aria-label="Filtres rapides">
          <button
            type="button"
            className={`chip${statusFilter === null ? " active" : ""}`}
            onClick={() => setStatusFilter(null)}
            aria-pressed={statusFilter === null}
          >
            Toutes
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "aFaire" ? " active" : ""}`}
            onClick={() => setStatusFilter("aFaire")}
            aria-pressed={statusFilter === "aFaire"}
          >
            A faire
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "enCours" ? " active" : ""}`}
            onClick={() => setStatusFilter("enCours")}
            aria-pressed={statusFilter === "enCours"}
          >
            En cours
          </button>
          <button
            type="button"
            className={`chip${statusFilter === "terminee" ? " active" : ""}`}
            onClick={() => setStatusFilter("terminee")}
            aria-pressed={statusFilter === "terminee"}
          >
            Terminees
          </button>
        </div>

        <div className="board-filter-group" aria-label="Filtre de categorie">
          <span className="segment-label">Categorie</span>
          <div className="chip-row">
            <button
              type="button"
              className={`chip${categoryFilter === "all" ? " active" : ""}`}
              onClick={() => setCategoryFilter("all")}
              aria-pressed={categoryFilter === "all"}
            >
              Toutes les categories
            </button>
            {availableCategoryKeys.map((categoryKey) => (
              <button
                key={categoryKey}
                type="button"
                className={`chip${categoryFilter === categoryKey ? " active" : ""}`}
                onClick={() => setCategoryFilter(categoryKey)}
                aria-pressed={categoryFilter === categoryKey}
              >
                {categoryLabels[categoryKey] ?? categoryKey}
              </button>
            ))}
          </div>
        </div>
      </section>

      {(actionInfo || info) && (
        <p id="info" className="info-banner" role="status" aria-live="polite">
          {actionInfo || info}
        </p>
      )}

      {isLoadingProjects ? (
        <p className="info-banner" role="status" aria-live="polite">
          Chargement des projets...
        </p>
      ) : null}

      {projectError ? (
        <p className="info-banner" role="alert">
          {projectError}
        </p>
      ) : null}

      {isLoadingTasks ? (
        <p className="info-banner" role="status" aria-live="polite">
          Chargement des taches...
        </p>
      ) : null}

      {taskError ? (
        <p className="info-banner" role="alert">
          {taskError}
        </p>
      ) : null}

      {truncationMessage ? (
        <p className="info-banner" role="status" aria-live="polite">
          {truncationMessage}
        </p>
      ) : null}

      {paginationUi.shouldShow && (
        <section className="form-panel" aria-label="Pagination des taches">
          <div className="action-row">
            <button
              type="button"
              className="action-link ui-btn ui-btn-secondary"
              onClick={goToPreviousPage}
              disabled={paginationUi.previousDisabled}
            >
              Precedent
            </button>
            <p className="hero-subtitle" aria-live="polite">
              {paginationUi.label}
            </p>
            <button
              type="button"
              className="action-link ui-btn ui-btn-secondary"
              onClick={goToNextPage}
              disabled={paginationUi.nextDisabled}
            >
              Suivant
            </button>
          </div>
        </section>
      )}

      <section className="kpi-grid" id="tableau">
        <article className="kpi-card">
          <p className="kpi-label">Total</p>
          <p className="kpi-value">{total}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">A faire</p>
          <p className="kpi-value">{aFaire}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">En cours</p>
          <p className="kpi-value">{enCours}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Terminees</p>
          <p className="kpi-value">{terminees}</p>
        </article>
      </section>

      <ProjectCalendar tasks={visibleTasks} activeProjectId={activeProjectId} />

      <CategoryManager
        categoryOrder={categoryOrder}
        categoryLabels={categoryLabels}
        updateCategoryLabel={updateCategoryLabel}
        resetCategoryLabels={resetCategoryLabels}
        newCategoryLabel={newCategoryLabel}
        setNewCategoryLabel={setNewCategoryLabel}
        addCategory={addCategory}
      />

      <section id="taches" className="kanban-panel">
        <div className="panel-head">
          <h2>Tableau - Vue par statut</h2>
          <Link
            href={`/detail?projectId=${activeProjectId}`}
            className="panel-link primary-cta"
          >
            + Ajouter une tache
          </Link>
        </div>

        <div className="kanban-columns">
          <TaskCategorySection
            key="aFaire"
            categoryKey="aFaire"
            categoryLabel="A faire"
            isKanbanColumn={true}
            activeProjectId={activeProjectId}
            tasks={groupedTasksByStatus["aFaire"] ?? []}
            allTasks={tasks}
            onDeleteTask={handleDeleteTask}
          />
          <TaskCategorySection
            key="enCours"
            categoryKey="enCours"
            categoryLabel="En cours"
            isKanbanColumn={true}
            activeProjectId={activeProjectId}
            tasks={groupedTasksByStatus["enCours"] ?? []}
            allTasks={tasks}
            onDeleteTask={handleDeleteTask}
          />
          <TaskCategorySection
            key="terminee"
            categoryKey="terminee"
            categoryLabel="Terminees"
            isKanbanColumn={true}
            activeProjectId={activeProjectId}
            tasks={groupedTasksByStatus["terminee"] ?? []}
            allTasks={tasks}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </section>

      {tacheGuide ? <GuideModal tacheGuide={tacheGuide} /> : null}
    </main>
  );
}
