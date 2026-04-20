"use client";

import { useEffect, useState } from "react";
import { useProjectsWithApiDecorated } from "./use-projects";
import { useBoardTasksPaging } from "./use-board-tasks-paging";
import { useBoardFilters } from "./use-board-filters";
import { useBoardKanbanActions } from "./use-board-kanban-actions";
import {
  DEFAULT_CATEGORY_LABELS,
  slugify,
  STORAGE_ACTIVE_PROJECT_KEY,
  STORAGE_LABELS_KEY,
  STORAGE_ORDER_KEY,
} from "../components/category-constants";

export { TASKS_PAGE_SIZE, STATUS_FILTER_LABELS } from "../lib/board-constants";

export function useProjectBoardState({
  initialProjectId,
  view = "kanban",
  searchParams,
}) {
  const guideId = searchParams?.get?.("guide");

  const [categoryLabels, setCategoryLabels] = useState(DEFAULT_CATEGORY_LABELS);
  const [categoryOrder, setCategoryOrder] = useState(
    Object.keys(DEFAULT_CATEGORY_LABELS),
  );
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const { projects, isLoadingProjects, projectError } =
    useProjectsWithApiDecorated();
  const [activeProjectId, setActiveProjectId] = useState(
    initialProjectId || null,
  );

  const activeView = [
    "dashboard",
    "kanban",
    "table",
    "calendar",
    "list",
  ].includes(view)
    ? view
    : "kanban";

  const {
    tasks,
    taskPagination,
    isLoadingTasks,
    taskError,
    setTaskError,
    bumpTasksReload,
    truncationMessage,
    paginationUi,
    goToPreviousPage,
    goToNextPage,
    calendarTasks,
    isLoadingCalendar,
  } = useBoardTasksPaging({ activeProjectId, activeView });

  const {
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    availableCategoryKeys,
    visibleTasks,
    calendarFilteredTasks,
    groupedTasksByStatus,
    sortedVisibleTasks,
    groupedForListView,
    total,
    aFaire,
    enCours,
    terminees,
    resetBoardFilters,
    filtersHideAllTasks,
  } = useBoardFilters({
    activeProjectId,
    activeView,
    tasks,
    calendarTasks,
    isLoadingCalendar,
    isLoadingTasks,
    taskError,
    categoryOrder,
  });

  const { movingTaskIds, actionInfo, handleDeleteTask, handleMoveTask } =
    useBoardKanbanActions({
      tasks,
      bumpTasksReload,
      setTaskError,
    });

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

  const tacheGuide = tasks.find(
    (tache) => String(tache.id) === String(guideId),
  );

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

  return {
    projects,
    isLoadingProjects,
    projectError,
    categoryLabels,
    categoryOrder,
    newCategoryLabel,
    setNewCategoryLabel,
    activeProjectId,
    setActiveProjectId,
    tasks,
    taskPagination,
    isLoadingTasks,
    taskError,
    setTaskError,
    actionInfo,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    movingTaskIds,
    calendarTasks,
    isLoadingCalendar,
    activeView,
    availableCategoryKeys,
    visibleTasks,
    calendarFilteredTasks,
    tacheGuide,
    groupedTasksByStatus,
    sortedVisibleTasks,
    groupedForListView,
    total,
    aFaire,
    enCours,
    terminees,
    truncationMessage,
    paginationUi,
    goToPreviousPage,
    goToNextPage,
    updateCategoryLabel,
    addCategory,
    resetCategoryLabels,
    handleDeleteTask,
    handleMoveTask,
    resetBoardFilters,
    filtersHideAllTasks,
    activeProjectName,
  };
}
